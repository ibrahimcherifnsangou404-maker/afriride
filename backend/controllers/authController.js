const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const emailService = require('../services/emailService');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const EMAIL_CODE_EXPIRY_MINUTES = 10;

const generateEmailVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildEmailVerificationToken = (code) => {
  const expiresAt = new Date(Date.now() + EMAIL_CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const hashedCode = crypto
    .createHash('sha256')
    .update(String(code || '').trim())
    .digest('hex');

  return `${hashedCode}:${expiresAt}`;
};

const parseEmailVerificationToken = (storedToken) => {
  const [hashedCode, expiresAt] = String(storedToken || '').split(':');
  if (!hashedCode || !expiresAt) {
    return null;
  }

  const expireDate = new Date(expiresAt);
  if (Number.isNaN(expireDate.getTime())) {
    return null;
  }

  return { hashedCode, expiresAt: expireDate };
};

const verifyEmailCodeMatches = (storedToken, code) => {
  const parsedToken = parseEmailVerificationToken(storedToken);
  if (!parsedToken) {
    return { valid: false, reason: 'invalid' };
  }

  if (parsedToken.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: 'expired' };
  }

  const hashedAttempt = crypto
    .createHash('sha256')
    .update(String(code || '').trim())
    .digest('hex');

  if (hashedAttempt !== parsedToken.hashedCode) {
    return { valid: false, reason: 'mismatch' };
  }

  return { valid: true };
};

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
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!emailService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Le service email de verification n est pas configure. Configurez EMAIL_USER et EMAIL_PASSWORD ou RESEND_API_KEY avant de creer de nouveaux comptes.'
      });
    }

    // Vérifier si tous les champs sont remplis
    if (!firstName || !lastName || !normalizedEmail || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez entrer une adresse email valide'
      });
    }

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ where: { email: normalizedEmail } });
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
    const confirmationCode = generateEmailVerificationCode();
    const emailConfirmationToken = buildEmailVerificationToken(confirmationCode);

    // Créer l'utilisateur (non vérifié par défaut si modèle configuré ainsi)
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password,
      role: 'client',
      isVerified: false,
      verificationStatus: 'unverified',
      emailConfirmationToken
    });

    // Créer l'URL de confirmation
    // Envoyer email de confirmation
    try {
      const emailResult = await emailService.sendVerificationCodeEmail(user, confirmationCode, EMAIL_CODE_EXPIRY_MINUTES);
      if (!emailResult?.success) {
        await user.destroy();
        return res.status(502).json({
          success: false,
          message: 'Impossible d envoyer l email de verification pour le moment. Verifiez la configuration email du serveur puis reessayez.'
        });
      }
    } catch (emailError) {
      await user.destroy();
      console.error('Erreur envoi email confirmation:', emailError);
      return res.status(502).json({
        success: false,
        message: 'Impossible d envoyer l email de verification pour le moment. Veuillez reessayer plus tard.'
      });
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
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Veuillez entrer une adresse email valide'
      });
    }
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

// @desc    Vérifier un code email
// @route   POST /api/auth/confirm-email-code
// @access  Public
const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !code) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir votre email et le code de vérification'
      });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification invalide'
      });
    }

    if (user.isVerified) {
      const token = generateToken(user.id);

      return res.status(200).json({
        success: true,
        message: 'Email déjà confirmé',
        data: {
          token,
          user: {
            id: user.id,
            firstName: user.firstName,
            email: user.email,
            role: user.role,
            isVerified: true
          }
        }
      });
    }

    const codeCheck = verifyEmailCodeMatches(user.emailConfirmationToken, code);
    if (!codeCheck.valid) {
      return res.status(400).json({
        success: false,
        message: codeCheck.reason === 'expired'
          ? 'Le code de vérification a expiré. Demandez-en un nouveau.'
          : 'Code de vérification invalide'
      });
    }

    user.isVerified = true;
    user.verificationStatus = 'pending';
    user.emailConfirmationToken = null;
    await user.save();

    const token = generateToken(user.id);

    emailService.sendWelcomeEmail(user).catch((err) =>
      console.error('Erreur envoi email bienvenue:', err.message)
    );

    return res.status(200).json({
      success: true,
      message: 'Email confirmé avec succès',
      data: {
        token,
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
    console.error('Erreur vérification code email:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du code email',
      error: error.message
    });
  }
};

// @desc    Renvoyer un code email
// @route   POST /api/auth/resend-email-code
// @access  Public
const resendEmailCode = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir une adresse email valide'
      });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé pour cet email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà vérifié'
      });
    }

    const confirmationCode = generateEmailVerificationCode();
    user.emailConfirmationToken = buildEmailVerificationToken(confirmationCode);
    await user.save();

    try {
      const emailResult = await emailService.sendVerificationCodeEmail(user, confirmationCode, EMAIL_CODE_EXPIRY_MINUTES);
      if (!emailResult?.success) {
        return res.status(502).json({
          success: false,
          message: 'Impossible d envoyer le code de verification pour le moment'
        });
      }
    } catch (emailError) {
      console.error('Erreur renvoi code email:', emailError);
      return res.status(502).json({
        success: false,
        message: 'Impossible d envoyer le code de verification pour le moment'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Un nouveau code de vérification a été envoyé'
    });
  } catch (error) {
    console.error('Erreur renvoi code email:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi du code',
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
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Vérifier si tous les champs sont remplis
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Veuillez vérifier votre email avec le code reçu avant de vous connecter'
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
  verifyEmailCode,
  resendEmailCode,
  updatePassword
};
