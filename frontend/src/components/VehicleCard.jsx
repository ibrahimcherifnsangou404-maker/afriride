import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Fuel, Zap, MapPin, ChevronRight, ChevronLeft, Calendar, Heart } from 'lucide-react';
import { Badge, Button } from './UI';
import { favoriteService } from '../services/favoriteService';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

const VehicleCard = ({ vehicle, initialIsLiked = false, skipFavoriteCheck = false, onFavoriteChange = null }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeLoading, setLikeLoading] = useState(false);
    const vehicleId = vehicle?.id;

    const checkFavorite = useCallback(async () => {
        if (!vehicleId) return;
        try {
            const response = await favoriteService.checkFavoriteStatus(vehicleId);
            if (response.success) {
                setIsLiked(response.isFavorite);
                if (typeof onFavoriteChange === 'function') {
                    onFavoriteChange(vehicle.id, response.isFavorite);
                }
            }
        } catch {
            // Silencieux si erreur (pas critique pour une carte)
        }
    }, [vehicleId]);

    // Vérifier si le véhicule est favori
    useEffect(() => {
        if (!skipFavoriteCheck && isAuthenticated && vehicleId) {
            checkFavorite();
        }
    }, [skipFavoriteCheck, isAuthenticated, vehicleId, checkFavorite]);

    useEffect(() => {
        setIsLiked(Boolean(initialIsLiked));
    }, [initialIsLiked, vehicleId]);

    const toggleLike = async (e) => {
        e.preventDefault(); // Empêcher la navigation
        e.stopPropagation();

        if (!isAuthenticated) {
            alert('Veuillez vous connecter pour ajouter aux favoris');
            return;
        }

        try {
            setLikeLoading(true);
            const response = await favoriteService.toggleFavorite(vehicle.id);
            if (response.success) {
                setIsLiked(response.isFavorite);
                if (typeof onFavoriteChange === 'function') {
                    onFavoriteChange(vehicle.id, response.isFavorite);
                }
            }
        } catch (error) {
            console.error('Erreur like:', error);
        } finally {
            setLikeLoading(false);
        }
    };

    // Préparer les images
    const images = vehicle.images && vehicle.images.length > 0
        ? vehicle.images.map(img => img.startsWith('http') ? img : `${API_BASE_URL}${img}`)
        : vehicle.image
            ? [vehicle.image.startsWith('http') ? vehicle.image : `${API_BASE_URL}${vehicle.image}`]
            : [];

    // Rotation automatique du carrousel au survol
    useEffect(() => {
        let interval;
        if (isHovered && images.length > 1) {
            interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
            }, 1500); // Change every 1.5s
        }
        return () => clearInterval(interval);
    }, [isHovered, images.length]);

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <Link
            to={`/vehicles/${vehicle.id}`}
            className="group block h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setCurrentImageIndex(0);
            }}
        >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 h-full flex flex-col transform group-hover:-translate-y-1 relative">

                {/* Bouton Like Flottant */}
                <button
                    type="button"
                    onClick={toggleLike}
                    aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md shadow-sm transition-all duration-300 ${isLiked
                        ? 'bg-red-50 text-red-500 hover:bg-red-100 scale-110'
                        : 'bg-white/80 text-slate-400 hover:bg-white hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${likeLoading ? 'animate-pulse' : ''}`} />
                </button>

                {/* Image Container */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {images.length > 0 ? (
                        <>
                            {images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                    loading="lazy"
                                    decoding="async"
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                        }`}
                                />
                            ))}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Navigation Arrows (toujours visibles sur mobile, au survol sur desktop) */}
                            {images.length > 1 && (
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        type="button"
                                        onClick={prevImage}
                                        aria-label="Image precedente"
                                        className="p-1.5 bg-white/90 hover:bg-white rounded-full text-slate-900 shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextImage}
                                        aria-label="Image suivante"
                                        className="p-1.5 bg-white/90 hover:bg-white rounded-full text-slate-900 shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Image Indicators */}
                            {images.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <span className="text-sm font-medium">Image non disponible</span>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {vehicle.category && (
                            <Badge variant="primary" className="shadow-lg backdrop-blur-md bg-primary-600/90 text-white border-0">
                                {vehicle.category.name}
                            </Badge>
                        )}
                        {vehicle.isAvailable ? (
                            <Badge variant="success" className="shadow-lg backdrop-blur-md bg-green-500/90 text-white border-0">
                                Dispo
                            </Badge>
                        ) : (
                            <Badge variant="error" className="shadow-lg backdrop-blur-md bg-red-500/90 text-white border-0">
                                Indispo
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                {vehicle.brand} {vehicle.model}
                            </h3>
                        </div>
                        <div className="flex items-center text-sm text-slate-500 font-medium">
                            <Calendar className="w-4 h-4 mr-1.5 text-primary-500" />
                            {vehicle.year}
                        </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-6">
                        <div className="flex items-center text-sm text-slate-600">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-primary-50 transition-colors">
                                <Users className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                            </div>
                            <span className="truncate">{vehicle.seats} places</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-primary-50 transition-colors">
                                <Fuel className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                            </div>
                            <span className="truncate capitalize">{vehicle.fuelType}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-primary-50 transition-colors">
                                <Zap className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                            </div>
                            <span className="truncate capitalize">
                                {vehicle.transmission === 'automatic' ? 'Auto' : 'Manuelle'}
                            </span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-primary-50 transition-colors">
                                <MapPin className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                            </div>
                            <span className="truncate">{vehicle.agency?.name}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Prix journalier</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900">
                                    {parseFloat(vehicle.pricePerDay || 0).toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-slate-500">FCFA</span>
                            </div>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 transform group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default VehicleCard;



