const { User, Agency } = require('../models');

const userController = {
    // @desc    Soumettre les documents KYC
    // @route   POST /api/users/kyc
    // @access  Private
    submitKYC: async (req, res) => {
        try {
            // Vérifier si des fichiers ont été uploadés
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun document fourni'
                });
            }

            const updateData = {
                verificationStatus: 'pending',
                rejectionReason: null // Réinitialiser la raison de rejet si nouvelle soumission
            };

            if (req.files.idCardFront) {
                updateData.idCardFront = `/uploads/documents/${req.files.idCardFront[0].filename}`;
            }
            if (req.files.idCardBack) {
                updateData.idCardBack = `/uploads/documents/${req.files.idCardBack[0].filename}`;
            }
            if (req.files.drivingLicense) {
                updateData.drivingLicense = `/uploads/documents/${req.files.drivingLicense[0].filename}`;
            }

            const user = await User.findByPk(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            await user.update(updateData);

            res.json({
                success: true,
                message: 'Documents soumis avec succès. Votre profil est en cours de vérification.',
                data: {
                    verificationStatus: user.verificationStatus,
                    idCardFront: user.idCardFront,
                    idCardBack: user.idCardBack,
                    drivingLicense: user.drivingLicense
                }
            });

        } catch (error) {
            console.error('Erreur soumission KYC:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la soumission des documents',
                error: error.message
            });
        }
    },

    // @desc    Obtenir le profil utilisateur
    // @route   GET /api/users/profile
    // @access  Private
    getProfile: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: Agency,
                        as: 'agency',
                        required: false
                    }
                ]
            });

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.json({
                success: true,
                data: user
            });

        } catch (error) {
            console.error('Erreur récupération profil:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du profil'
            });
        }
    },

    // @desc    Mettre à jour le profil
    // @route   PUT /api/users/profile
    // @access  Private
    updateProfile: async (req, res) => {
        try {
            const { firstName, lastName, phone } = req.body;
            const user = await User.findByPk(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            await user.update({
                firstName: firstName || user.firstName,
                lastName: lastName || user.lastName,
                phone: phone || user.phone
            });

            res.json({
                success: true,
                message: 'Profil mis à jour avec succès',
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone
                }
            });

        } catch (error) {
            console.error('Erreur maj profil:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du profil'
            });
        }
    }
};

module.exports = userController;
