const { Favorite, Vehicle, Agency, Category } = require('../models');

// @desc    Ajouter ou retirer un favori (Toggle)
// @route   POST /api/favorites/:vehicleId
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const userId = req.user.id;

        console.log('🔄 Toggle favori - userId:', userId, 'vehicleId:', vehicleId);

        // Vérifier si le véhicule existe
        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            console.log('❌ Véhicule non trouvé:', vehicleId);
            return res.status(404).json({
                success: false,
                message: 'Véhicule non trouvé'
            });
        }

        // Vérifier si déjà en favori
        const existingFavorite = await Favorite.findOne({
            where: {
                user_id: userId,
                vehicle_id: vehicleId
            }
        });

        if (existingFavorite) {
            // Retirer des favoris
            await existingFavorite.destroy();
            console.log('💔 Favori retiré');
            return res.status(200).json({
                success: true,
                message: 'Retiré des favoris',
                isFavorite: false
            });
        } else {
            // Ajouter aux favoris
            const newFavorite = await Favorite.create({
                user_id: userId,
                vehicle_id: vehicleId
            });
            console.log('❤️ Favori ajouté:', newFavorite.id);
            return res.status(201).json({
                success: true,
                message: 'Ajouté aux favoris',
                isFavorite: true
            });
        }

    } catch (error) {
        console.error('❌ Erreur toggle favori:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des favoris',
            error: error.message
        });
    }
};

// @desc    Récupérer tous les favoris de l'utilisateur
// @route   GET /api/favorites
// @access  Private
const getMyFavorites = async (req, res) => {
    try {
        console.log('📋 Récupération favoris pour userId:', req.user?.id);

        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Tentative avec include complet
        try {
            const favorites = await Favorite.findAll({
                where: { user_id: req.user.id },
                include: [
                    {
                        model: Vehicle,
                        as: 'vehicle',
                        include: [
                            { model: Agency, as: 'agency', attributes: ['id', 'name'] },
                            { model: Category, as: 'category', attributes: ['id', 'name'] }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            console.log('✅ Favoris trouvés:', favorites.length);
            return res.status(200).json({
                success: true,
                count: favorites.length,
                data: favorites
            });
        } catch (includeError) {
            console.warn('⚠️ Include favorites failed, fallback without nested include:', includeError.message);
        }

        // Fallback robuste si l'include plante (alias/associations)
        const favoritesRaw = await Favorite.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        const vehicleIds = favoritesRaw.map((f) => f.vehicle_id).filter(Boolean);
        const vehicles = await Vehicle.findAll({
            where: { id: vehicleIds },
            include: [
                { model: Agency, as: 'agency', attributes: ['id', 'name'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] }
            ]
        });

        const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
        const enriched = favoritesRaw.map((f) => ({
            ...f.toJSON(),
            vehicle: vehicleMap.get(f.vehicle_id) || null
        }));

        console.log('✅ Favoris (fallback) trouvés:', enriched.length);
        res.status(200).json({
            success: true,
            count: enriched.length,
            data: enriched
        });
    } catch (error) {
        console.error('❌ Erreur récupération favoris:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des favoris',
            error: error.message
        });
    }
};

// @desc    Vérifier si un véhicule est favori
// @route   GET /api/favorites/check/:vehicleId
// @access  Private
const checkFavoriteStatus = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const userId = req.user.id;

        const favorite = await Favorite.findOne({
            where: {
                user_id: userId,
                vehicle_id: vehicleId
            }
        });

        res.status(200).json({
            success: true,
            isFavorite: !!favorite
        });

    } catch (error) {
        console.error('Erreur check favori:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur vérification favori',
            error: error.message
        });
    }
};

module.exports = {
    toggleFavorite,
    getMyFavorites,
    checkFavoriteStatus
};
