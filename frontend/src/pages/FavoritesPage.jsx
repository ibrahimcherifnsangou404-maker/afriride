import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { favoriteService } from '../services/favoriteService';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import { Footer } from '../components/Layout/Footer';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoriteService.getMyFavorites();
      if (response?.success) {
        // Normalize backend responses that may return nested favorites arrays.
        if (Array.isArray(response.data)) {
          setFavorites(response.data);
        } else if (Array.isArray(response?.data?.data)) {
          setFavorites(response.data.data);
        } else if (Array.isArray(response)) {
          setFavorites(response);
        } else {
          setFavorites([]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 pt-8 pb-8 px-4 shadow-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ma Wishlist</h1>
              <p className="text-slate-500">Retrouvez tous vos coups de coeur sauvegardes.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-full">
                <VehicleCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites
              .map((fav) => fav?.vehicle || fav)
              .filter(Boolean)
              .map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default FavoritesPage;
