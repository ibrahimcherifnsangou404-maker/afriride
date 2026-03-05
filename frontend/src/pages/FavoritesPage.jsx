import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Search } from 'lucide-react';
import { favoriteService } from '../services/favoriteService';
import VehicleCard from '../components/VehicleCard';
import { Footer } from '../components/Layout/Footer';
import { Button, Loading } from '../components/UI';

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
                // Normaliser: certains backends renvoient { data: favorites }
                // d'autres renvoient directement un tableau de véhicules
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

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-8 px-4 shadow-sm">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                            <Heart className="w-8 h-8 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Ma Wishlist</h1>
                            <p className="text-slate-500">Retrouvez tous vos coups de cÅ“ur sauvegardés.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl py-8">

                {loading ? (
                    <Loading />
                ) : favorites.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto mt-12">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Votre liste est vide</h3>
                        <p className="text-slate-500 mb-8 text-lg">Vous n'avez pas encore ajouté de véhicules à vos favoris. Explorez notre catalogue pour trouver votre bonheur !</p>
                        <Link to="/vehicles">
                            <Button size="lg" className="w-full sm:w-auto">
                                <Search className="w-5 h-5 mr-2" />
                                Explorer les véhicules
                            </Button>
                        </Link>
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

