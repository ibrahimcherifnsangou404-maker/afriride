const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const emailService = require('../services/emailService');

// Fonction pour générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

// @desc    Inscription d'un nouveau client
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Vérifier si tous les champs sont remplis
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs'
      });
    }

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Générer un token de confirmation (aléatoire)
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // Hasher le token pour le stockage
    const hashedConfirmationToken = crypto
      .createHash('sha256')
      .update(confirmationToken)
      .digest('hex');

    // Créer l'utilisateur (non vérifié par défaut si modèle configuré ainsi)
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'client',
      isVerified: false,
      verificationStatus: 'unverified',
      emailConfirmationToken: hashedConfirmationToken
    });

    // Créer l'URL de confirmation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const confirmUrl = `${frontendUrl}/confirm-email/${confirmationToken}`;

    // Envoyer email de confirmation
    try {
      await emailService.sendConfirmationEmail(user, confirmUrl);
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
      // On continue quand même, l'utilisateur pourra demander un renvoi
    }

    res.status(201).json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
      data: {
        id: user.id,
        email: user.email,
        isVerified: false
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// @desc    Confirmer l'adresse email
// @route   GET /api/auth/confirm-email/:token
// @access  Public
const confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hasher le token reçu pour comparaison
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      where: {
        emailConfirmationToken: hashedToken
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de confirmation invalide ou utilisateur déjà vérifié'
      });
    }

    // Mettre à jour l'utilisateur
    user.isVerified = true;
    user.verificationStatus = 'pending'; // Passe à pending pour KYC, ou verified si pas de KYC obligatoire tout de suite
    user.emailConfirmationToken = null;
    await user.save();

    // Générer un token JWT pour connexion automatique (optionnel, mais pratique)
    const jwtToken = generateToken(user.id);

    // Envoyer email de bienvenue maintenant que c'est confirmé
    emailService.sendWelcomeEmail(user).catch(err =>
      console.error('Erreur envoi email bienvenue:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Email confirmé avec succès',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          email: user.email,
          role: user.role,
          isVerified: true
        }
      }
    });

  } catch (error) {
    console.error('Erreur confirmation email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation de l\'email',
      error: error.message
    });
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si tous les champs sont remplis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        token
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Connexion via Google (ID token)
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Token Google manquant'
      });
    }

    if (!googleClient) {
      return res.status(500).json({
        success: false,
        message: 'Google client non configuré'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId
    });
    const payload = ticket.getPayload() || {};

    const email = payload.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email Google manquant'
      });
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      user = await User.create({
        firstName: payload.given_name || 'Utilisateur',
        lastName: payload.family_name || 'Google',
        email,
        phone: 'N/A',
        password: randomPassword,
        role: 'client',
        isVerified: true,
        verificationStatus: 'unverified',
        profilePicture: payload.picture || null
      });
    } else {
      const updates = {};
      if (!user.firstName && payload.given_name) updates.firstName = payload.given_name;
      if (!user.lastName && payload.family_name) updates.lastName = payload.family_name;
      if (!user.profilePicture && payload.picture) updates.profilePicture = payload.picture;
      if (user.isVerified !== true) updates.isVerified = true;
      if (Object.keys(updates).length > 0) {
        await user.update(updates);
      }
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Connexion Google réussie',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationStatus: user.verificationStatus,
        token
      }
    });
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion Google',
      error: error.message
    });
  }
};

// @desc    Récupérer le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Gérer l'upload d'image
    if (req.file) {
      const profilePicture = `/uploads/profiles/${req.file.filename}`;
      user.profilePicture = profilePicture;
    }

    // Mettre à jour les champs
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le mot de passe (connecté)
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les nouveaux mots de passe ne correspondent pas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await User.findByPk(req.user.id);

    // Vérifier l'ancien mot de passe
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du mot de passe',
      error: error.message
    });
  }
};

// @desc    Demande de réinitialisation de mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    }

    // Générer un token aléatoire
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hasher le token avant de le sauvegarder
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Définir l'expiration (1 heure)
    const expireDate = new Date(Date.now() + 60 * 60 * 1000);

    // Sauvegarder le token hashé et l'expiration
    await user.update({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: expireDate
    });

    // Créer l'URL de réinitialisation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Envoyer l'email
    try {
      await emailService.sendPasswordResetEmail(user, resetUrl);

      res.status(200).json({
        success: true,
        message: 'Un email de réinitialisation a été envoyé à votre adresse'
      });
    } catch (emailError) {
      // En cas d'erreur d'envoi, effacer le token
      await user.update({
        resetPasswordToken: null,
        resetPasswordExpire: null
      });

      console.error('Erreur envoi email reset:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
      });
    }

  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message
    });
  }
};

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Vérifier les champs
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir le nouveau mot de passe et sa confirmation'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Hasher le token reçu pour le comparer
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec le token valide et non expiré
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Vérifier l'expiration
    if (new Date() > new Date(user.resetPasswordExpire)) {
      return res.status(400).json({
        success: false,
        message: 'Le lien de réinitialisation a expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleLogin,
  updateProfile,
  forgotPassword,
  resetPassword,
  confirmEmail,
  updatePassword
};
