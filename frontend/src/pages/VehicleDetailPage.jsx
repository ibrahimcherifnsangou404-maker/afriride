import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Car, ArrowLeft, MapPin, Users, Fuel, Settings,
  Calendar, Shield, CheckCircle, Phone, Mail, Star, CreditCard, Tag, MessageCircle,
  ChevronRight, Share2, Heart
} from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { bookingService } from '../services/bookingService';
import { reviewService } from '../services/reviewService';
import { promoCodeService } from '../services/promoCodeService';
import { favoriteService } from '../services/favoriteService'; // IMPORT
import { AuthContext } from '../context/AuthContext';
import { Badge, Button, Card, Loading, EmptyState, Skeleton } from '../components/UI';
import { API_BASE_URL } from '../services/api';


function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [priceComparisons, setPriceComparisons] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // States pour les favoris
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // States pour la réservation
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: ''
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [requiresKyc, setRequiresKyc] = useState(false);

  // États pour le code promo
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const loadComparison = async () => {
      if (!vehicle?.brand || !vehicle?.model) {
        setPriceComparisons([]);
        return;
      }

      try {
        setComparisonLoading(true);

        const response = await vehicleService.getVehicles({
          // Recherche large par marque, puis filtrage strict côté client
          search: vehicle.brand,
          startDate: bookingData.startDate || undefined,
          endDate: bookingData.endDate || undefined
        });

        const normalizeText = (value) =>
          String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');

        const currentBrand = normalizeText(vehicle.brand);
        const currentModel = normalizeText(vehicle.model);

        const similarVehicles = (response?.data || []).filter((item) =>
          item.id !== vehicle.id &&
          normalizeText(item.brand) === currentBrand &&
          normalizeText(item.model) === currentModel &&
          item?.agency?.id
        );

        const bestOfferByAgency = new Map();

        similarVehicles.forEach((item) => {
          const agencyId = item.agency.id;
          const itemPrice = parseFloat(item.pricePerDay || 0);
          const current = bestOfferByAgency.get(agencyId);

          if (!current || itemPrice < current.pricePerDay) {
            bestOfferByAgency.set(agencyId, {
              vehicleId: item.id,
              agencyId,
              agencyName: item.agency.name,
              pricePerDay: itemPrice
            });
          }
        });

        const currentPrice = parseFloat(vehicle.pricePerDay || 0);
        const comparison = Array.from(bestOfferByAgency.values())
          .map((item) => {
            const priceGap = item.pricePerDay - currentPrice;
            const priceGapPercent = currentPrice > 0 ? (priceGap / currentPrice) * 100 : 0;

            return {
              ...item,
              priceGap,
              priceGapPercent
            };
          })
          .sort((a, b) => a.pricePerDay - b.pricePerDay);

        setPriceComparisons(comparison);
      } catch (error) {
        console.error('Erreur comparaison des prix agences:', error);
        setPriceComparisons([]);
      } finally {
        setComparisonLoading(false);
      }
    };

    loadComparison();
  }, [vehicle, bookingData.startDate, bookingData.endDate]);

  const checkFavorite = useCallback(async () => {
    try {
      const response = await favoriteService.checkFavoriteStatus(id);
      if (response.success) {
        setIsLiked(response.isFavorite);
      }
    } catch (error) {
      console.error('Erreur check favori:', error);
    }
  }, [id]);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/vehicles/${id}` } });
      return;
    }

    try {
      setLikeLoading(true);
      const response = await favoriteService.toggleFavorite(id);
      if (response.success) {
        setIsLiked(response.isFavorite);
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const loadVehicle = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleById(id);
      setVehicle(response.data);

      try {
        const reviewsResponse = await reviewService.getVehicleReviews(id);
        setReviews(reviewsResponse.data || []);
        setAvgRating(parseFloat(reviewsResponse.avgRating || 0));
      } catch (err) {
        console.warn('Erreur chargement avis:', err);
      }
    } catch (error) {
      console.error('Erreur chargement véhicule:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    loadVehicle();
    window.scrollTo(0, 0);
  }, [loadVehicle]);

  // UseEffect separated to avoid reloading vehicle just for auth change
  useEffect(() => {
    if (isAuthenticated && id) {
      checkFavorite();
    }
  }, [isAuthenticated, id, checkFavorite]);

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  const calculateTotal = () => {
    if (!bookingData.startDate || !bookingData.endDate || !vehicle) {
      return { days: 0, subtotal: 0, finalTotal: 0 };
    }

    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) return { days: 0, subtotal: 0, finalTotal: 0 };

    const subtotal = days * parseFloat(vehicle.pricePerDay);
    const finalTotal = Math.max(0, subtotal - discount);

    return { days, subtotal, finalTotal };
  };

  const { days, subtotal, finalTotal } = calculateTotal();

  const setQuickRange = (rangeDays) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + rangeDays);

    setBookingData({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
    setBookingError('');
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Entrez un code promo');
      return;
    }

    if (subtotal === 0) {
      setPromoError('Choisissez vos dates d abord');
      return;
    }

    try {
      setPromoLoading(true);
      setPromoError('');
      const response = await promoCodeService.validatePromoCode(promoCode.toUpperCase(), subtotal);
      if (response.success) {
        setAppliedPromo(response.data);
        setDiscount(response.data.discountAmount);
        setPromoError('');
      }
    } catch (error) {
      setPromoError(error.response?.data?.message || 'Code invalide');
      setAppliedPromo(null);
      setDiscount(0);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleBooking = async () => {
    setBookingError('');
    setRequiresKyc(false);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/vehicles/${id}` } });
      return;
    }

    if (user?.role === 'client' && user?.verificationStatus !== 'verified') {
      setBookingError('Votre identite doit etre verifiee avant de reserver un vehicule.');
      setRequiresKyc(true);
      return;
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      setBookingError('Selectionnez une date de depart et une date de retour.');
      return;
    }

    if (new Date(bookingData.endDate) <= new Date(bookingData.startDate)) {
      setBookingError('La date de retour doit etre posterieure a la date de depart.');
      return;
    }

    try {
      setBookingLoading(true);
      const availabilityResponse = await bookingService.checkAvailability({
        vehicleId: vehicle.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate
      });

      if (!availabilityResponse?.data?.available) {
        setBookingError('Le vehicule n est plus disponible sur cette plage. Ajustez vos dates.');
        return;
      }

      const response = await bookingService.createBooking({
        vehicleId: vehicle.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        promoCodeId: appliedPromo?.promoCode?.id || null,
        notes: ''
      });

      if (response.success) {
        // Nouveau flux : Redirection directe vers le paiement
        navigate(`/payment/${response.data.id}`);
      }
    } catch (error) {
      console.error('Erreur réservation:', error);
      if (error.response?.data?.errorCode === 'KYC_REQUIRED') {
        setRequiresKyc(true);
      }
      setBookingError(error.response?.data?.message || 'Erreur lors de la reservation');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleContactAgency = () => {
    if (!vehicle?.agency?.id) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/vehicles/${id}` } });
      return;
    }

    const params = new URLSearchParams({
      agencyId: vehicle.agency.id,
      vehicleLabel: `${vehicle.brand} ${vehicle.model}`,
      prefill: `Bonjour, je suis interesse par ${vehicle.brand} ${vehicle.model}${bookingData.startDate && bookingData.endDate ? ` du ${bookingData.startDate} au ${bookingData.endDate}` : ''}.`
    });

    if (bookingData.startDate) params.set('startDate', bookingData.startDate);
    if (bookingData.endDate) params.set('endDate', bookingData.endDate);

    navigate(`/messages?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 pt-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-[360px] w-full rounded-3xl" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[420px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <EmptyState
          icon={Car}
          title="Véhicule introuvable"
          message="Ce véhicule n'existe plus ou a été retiré."
          action={<Link to="/vehicles"><Button>Voir les autres véhicules</Button></Link>}
        />
      </div>
    );
  }

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images.map(getImageUrl)
    : [getImageUrl(vehicle.image)];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Header / Navigation Rapide */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 bg-opacity-90 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/vehicles" className="flex items-center text-slate-600 hover:text-slate-900 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour aux véhicules
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLike}
              disabled={likeLoading}
              aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`p-2 rounded-full transition-all ${isLiked ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${likeLoading ? 'animate-pulse' : ''}`} />
            </button>
            <button type="button" aria-label="Partager ce vehicule" className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

          {/* 2. Colonne Principale (Images & Infos) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Titre & Note */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="primary" size="sm">{vehicle.category?.name || 'Véhicule'}</Badge>
                  {vehicle.isAvailable ? (
                    <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      Disponible immediatement
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                      Non disponible
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-slate-500 font-medium mt-1">{vehicle.year} | {vehicle.transmission === 'automatic' ? 'Automatique' : 'Manuelle'} | {vehicle.fuelType}</p>
              </div>
              <div className="flex items-center bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                <div className="flex flex-col items-end mr-3">
                  <span className="text-sm font-bold text-slate-900">Note moyenne</span>
                  <span className="text-xs text-slate-500">{reviews.length} avis verifies</span>
                </div>
                <div className="bg-primary-600 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-lg">
                  {avgRating || 'N/A'}
                </div>
              </div>
            </div>

            {/* Galerie Immersive */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt="Vue principale"
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Car className="w-20 h-20 opacity-50" />
                  </div>
                )}

                {/* Navigation Overlay */}
                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                      aria-label="Image precedente"
                      className="p-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 rounded-full transition-all"
                    >
                      <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                      aria-label="Image suivante"
                      className="p-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 rounded-full transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="p-4 flex gap-3 overflow-x-auto border-t border-slate-200 bg-slate-50/50">
                  {images.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      aria-label={`Afficher image ${idx + 1}`}
                      className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${selectedImage === idx
                        ? 'ring-2 ring-primary-600 ring-offset-2 opacity-100'
                        : 'opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={img} alt={`Miniature ${idx}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Places', value: `${vehicle.seats} Passagers`, icon: Users },
                { label: 'Transmission', value: vehicle.transmission === 'automatic' ? 'Auto' : 'Manuelle', icon: Settings },
                { label: 'Carburant', value: vehicle.fuelType, icon: Fuel },
                { label: 'Couleur', value: vehicle.color, icon: Car },
              ].map((spec, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:border-primary-200 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                    <spec.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{spec.label}</p>
                    <p className="text-slate-900 font-bold capitalize">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Équipements inclus</h3>
                <div className="grid grid-cols-1 gap-3">
                  {vehicle.features?.map((feature, i) => (
                    <div key={i} className="flex items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{feature}</span>
                    </div>
                  ))}
                  {(!vehicle.features || vehicle.features.length === 0) && (
                    <p className="text-slate-500 italic">Aucun équipement spécifique listé.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Agence</h3>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 rounded-full -translate-y-16 translate-x-16" />
                  <div className="relative z-10">
                    <h4 className="font-bold text-lg text-slate-900 mb-4">{vehicle.agency?.name}</h4>
                    <div className="space-y-3">
                      <div className="flex items-start text-slate-600">
                        <MapPin className="w-5 h-5 mr-3 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>{vehicle.agency?.address}</span>
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Phone className="w-5 h-5 mr-3 text-primary-600 flex-shrink-0" />
                        <span>{vehicle.agency?.phone}</span>
                      </div>
                      {vehicle.agency?.email && (
                        <div className="flex items-center text-slate-600">
                          <Mail className="w-5 h-5 mr-3 text-primary-600 flex-shrink-0" />
                          <span>{vehicle.agency?.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-5">
                      <Button
                        onClick={handleContactAgency}
                        className="w-full"
                        variant="secondary"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contacter l agence
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparaison des prix entre agences */}
            <div className="pt-8 border-t border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Comparaison des prix entre agences</h3>
                <span className="text-sm text-slate-500 font-medium">
                  {bookingData.startDate && bookingData.endDate ? 'Selon vos dates' : 'Prix journalier'}
                </span>
              </div>

              {comparisonLoading ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500">Comparaison en cours...</p>
                </div>
              ) : priceComparisons.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500">Aucune offre comparable trouvée dans d'autres agences pour ce modèle.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priceComparisons.map((offer) => (
                    <div key={offer.agencyId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm text-slate-500">Agence</p>
                          <p className="font-bold text-slate-900">{offer.agencyName}</p>
                        </div>
                        <Badge
                          variant={offer.priceGap <= 0 ? 'success' : 'danger'}
                          size="sm"
                        >
                          {offer.priceGap <= 0 ? 'Moins cher' : 'Plus cher'}
                        </Badge>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-black text-slate-900">{offer.pricePerDay.toLocaleString()} FCFA</p>
                          <p className="text-xs text-slate-500">
                            {offer.priceGap === 0
                              ? 'Même prix que cette offre'
                              : `${offer.priceGap > 0 ? '+' : ''}${offer.priceGap.toLocaleString()} FCFA (${offer.priceGapPercent > 0 ? '+' : ''}${offer.priceGapPercent.toFixed(1)}%)`}
                          </p>
                        </div>
                        <Link to={`/vehicles/${offer.vehicleId}`}>
                          <Button size="sm" variant="secondary">Voir</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avis */}
            <div className="pt-8 border-t border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Avis Clients ({reviews.length})</h3>
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase">
                          {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{review.user?.firstName} {review.user?.lastName}</p>
                          <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600">{review.comment}</p>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">Aucun avis pour le moment.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 3. Sidebar Sticky (Réservation) */}
          <div className="lg:col-span-4 lg:relative">
            <div className="sticky top-24 space-y-6">
              <Card className="p-6 md:p-8 shadow-2xl border-slate-200 bg-white/90 backdrop-blur overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600" />

                {/* Prix Header */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black text-slate-900">{parseFloat(vehicle.pricePerDay).toLocaleString()}</span>
                  <span className="text-lg font-bold text-slate-500">FCFA</span>
                  <span className="text-sm text-slate-600 font-medium ml-1">/ jour</span>
                </div>

                {/* Formulaire Dates */}
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Départ</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 font-medium"
                        value={bookingData.startDate}
                        onChange={(e) => {
                          setBookingData({ ...bookingData, startDate: e.target.value });
                          setBookingError('');
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Retour</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 font-medium"
                        value={bookingData.endDate}
                        onChange={(e) => {
                          setBookingData({ ...bookingData, endDate: e.target.value });
                          setBookingError('');
                        }}
                        min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickRange(1)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    1 jour
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRange(3)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    3 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRange(7)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    1 semaine
                  </button>
                </div>

                {bookingError && (
                  <div role="alert" className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 font-medium">
                    {bookingError}
                  </div>
                )}
                {requiresKyc && (
                  <Button
                    variant="outline"
                    className="w-full mb-6"
                    onClick={() => navigate('/kyc')}
                  >
                    Completer ma verification
                  </Button>
                )}

                {/* Promo Code */}
                {!appliedPromo && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="CODE PROMO"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm uppercase font-bold focus:ring-1 focus:ring-primary-500"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        />
                      </div>
                      <Button size="sm" onClick={handleApplyPromoCode} disabled={promoLoading || !promoCode}>
                        {promoLoading ? '...' : 'OK'}
                      </Button>
                    </div>
                    {promoError && <p role="alert" className="text-xs text-red-500 mt-2 font-medium">{promoError}</p>}
                  </div>
                )}

                {/* Calcul Total */}
                {days > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                    <div className="space-y-2 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-200">
                      <div className="flex justify-between">
                        <span>{parseFloat(vehicle.pricePerDay).toLocaleString()} x {days} jours</span>
                        <span className="font-semibold text-slate-900">{subtotal.toLocaleString()} FCFA</span>
                      </div>
                      {appliedPromo && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {appliedPromo.promoCode.code}</span>
                          <span className="font-bold">-{discount.toLocaleString()} FCFA</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-black text-primary-600">{finalTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <Button
                  onClick={handleBooking}
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all transform hover:-translate-y-0.5"
                  disabled={bookingLoading || (isAuthenticated && !days)}
                >
                  {bookingLoading ? (
                    <span className="flex items-center"><Loading size="sm" className="mr-2" /> Traitement...</span>
                  ) : (
                    isAuthenticated ? 'Réserver ce véhicule' : 'Se connecter pour réserver'
                  )}
                </Button>

                <div className="mt-4 flex items-center justify-center text-xs text-slate-600 gap-2">
                  <Shield className="w-3 h-3" />
                  <span>Réservation sécurisée | Annulation gratuite</span>
                </div>
              </Card>

              {/* Help Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Besoin d aide ?</h4>
                  <p className="text-sm text-slate-600 mb-2">Un conseiller vous accompagne jusqu a la confirmation.</p>
                  <p className="font-bold text-blue-600 text-lg">+237 690 00 00 00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



    </div>
  );
}

export default VehicleDetailPage;




