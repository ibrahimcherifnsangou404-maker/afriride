import { useState, useEffect, useMemo, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Car, Calendar } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { Footer } from '../components/Layout/Footer';
import { favoriteService } from '../services/favoriteService';
import { AuthContext } from '../context/AuthContext';
import { Alert, Card, Button, EmptyState, Skeleton } from '../components/UI';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';

function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page') || 1),
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { isAuthenticated } = useContext(AuthContext);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    agency: searchParams.get('agency') || '',
    transmission: searchParams.get('transmission') || '',
    fuelType: searchParams.get('fuelType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    const term = filters.search.trim();
    if (term.length > 0 && term.length < 2) return;
    const timer = setTimeout(() => {
      applyFilters(1);
    }, 320);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const syncUrlState = (nextFilters, nextPage = pagination.page, nextSort = sortBy) => {
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextSort && nextSort !== 'newest') params.set('sort', nextSort);

    setSearchParams(params, { replace: true });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const favoritesPromise = isAuthenticated ? favoriteService.getMyFavorites() : Promise.resolve({ data: [] });
      const [vehiclesData, categoriesData, agenciesData, favoritesData] = await Promise.all([
        vehicleService.getVehicles({ ...filters, page: pagination.page, limit: pagination.limit }),
        vehicleService.getCategories(),
        vehicleService.getAgencies(),
        favoritesPromise
      ]);

      setVehicles(vehiclesData.data || []);
      setCategories(categoriesData.data || []);
      setAgencies(agenciesData.data || []);
      setPagination(vehiclesData.pagination || {
        page: 1,
        limit: pagination.limit,
        totalItems: vehiclesData.total || (vehiclesData.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
      const ids = (favoritesData?.data || []).map((f) => f.vehicleId);
      setFavoriteIds(new Set(ids));
    } catch (error) {
      console.error('Erreur chargement donnees:', error);
      setError(error.response?.data?.message || 'Impossible de charger le catalogue pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyFilters = async (targetPage = 1) => {
    try {
      setIsRefreshing(true);
      setError('');
      const vehiclesData = await vehicleService.getVehicles({
        ...filters,
        page: targetPage,
        limit: pagination.limit
      });
      setVehicles(vehiclesData.data || []);
      setPagination(vehiclesData.pagination || {
        page: targetPage,
        limit: pagination.limit,
        totalItems: vehiclesData.total || (vehiclesData.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: targetPage > 1
      });
      syncUrlState(filters, targetPage, sortBy);
    } catch (error) {
      console.error('Erreur filtrage:', error);
      setError(error.response?.data?.message || 'Impossible de mettre a jour les resultats.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetFilters = async () => {
    const nextFilters = {
      search: '',
      category: '',
      agency: '',
      transmission: '',
      fuelType: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: ''
    };
    setFilters(nextFilters);
    setError('');
    syncUrlState(nextFilters, 1, 'newest');
    setSortBy('newest');
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadData();
  };

  const removeFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: '' }));
  };

  const getActiveFilterChips = () => {
    const chips = [];
    if (filters.search) chips.push({ key: 'search', label: `Recherche: ${filters.search}` });
    if (filters.category) {
      const categoryName = categories.find((c) => c.id === filters.category)?.name || 'Categorie';
      chips.push({ key: 'category', label: `Categorie: ${categoryName}` });
    }
    if (filters.agency) {
      const agencyName = agencies.find((a) => a.id === filters.agency)?.name || 'Agence';
      chips.push({ key: 'agency', label: `Agence: ${agencyName}` });
    }
    if (filters.transmission) chips.push({ key: 'transmission', label: `Transmission: ${filters.transmission === 'automatic' ? 'Auto' : 'Manuelle'}` });
    if (filters.fuelType) chips.push({ key: 'fuelType', label: `Carburant: ${filters.fuelType}` });
    if (filters.startDate) chips.push({ key: 'startDate', label: `Debut: ${filters.startDate}` });
    if (filters.endDate) chips.push({ key: 'endDate', label: `Fin: ${filters.endDate}` });
    return chips;
  };

  const sortedVehicles = useMemo(() => [...vehicles].sort((a, b) => {
    const priceA = parseFloat(a?.pricePerDay || 0);
    const priceB = parseFloat(b?.pricePerDay || 0);
    if (sortBy === 'priceAsc') return priceA - priceB;
    if (sortBy === 'priceDesc') return priceB - priceA;
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  }), [vehicles, sortBy]);

  const activeChips = useMemo(() => getActiveFilterChips(), [filters, categories, agencies]);
  const vehicleSkeletons = useMemo(() => Array.from({ length: pagination.limit || 6 }), [pagination.limit]);

  const handleFavoriteChange = (vehicleId, isFavorite) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.add(vehicleId);
      } else {
        next.delete(vehicleId);
      }
      return next;
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) return;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    applyFilters(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    syncUrlState(filters, pagination.page, sortBy);
  }, [filters, pagination.page, sortBy]);

  useEffect(() => {
    vehicleService.prefetchCatalogue({ page: pagination.page, limit: pagination.limit });
  }, [pagination.page, pagination.limit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-14 md:py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Trouvez votre vehicule ideal</h1>
          <p className="text-white/90 text-base md:text-lg mb-7 max-w-3xl">
            Comparez rapidement les offres, filtrez precisement et reservez en quelques clics.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyFilters(1);
                    }
                  }}
                  placeholder="Marque, modele ou agence..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <Button onClick={applyFilters} size="md" variant="secondary" className="h-12 px-5">
                <Search className="w-5 h-5 mr-2" />
                Lancer la recherche
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="md"
                aria-expanded={showFilters}
                aria-controls="vehicles-advanced-filters"
                className="h-12 px-5 border-white text-white bg-white/10 hover:bg-white/20 focus:ring-white/60"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </Button>
            </div>

            {showFilters && (
              <Card id="vehicles-advanced-filters" className="rounded-2xl p-6 bg-white/95 backdrop-blur-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de debut
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de fin
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      min={filters.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Categorie</label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    >
                      <option value="">Toutes les categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Agence</label>
                    <select
                      name="agency"
                      value={filters.agency}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    >
                      <option value="">Toutes les agences</option>
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Transmission</label>
                    <select
                      name="transmission"
                      value={filters.transmission}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    >
                      <option value="">Toutes</option>
                      <option value="manual">Manuelle</option>
                      <option value="automatic">Automatique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Carburant</label>
                    <select
                      name="fuelType"
                      value={filters.fuelType}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    >
                      <option value="">Tous</option>
                      <option value="petrol">Essence</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electrique</option>
                      <option value="hybrid">Hybride</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={resetFilters}>Reinitialiser</Button>
                  <Button onClick={applyFilters}>Appliquer les filtres</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      <main className="flex-1 py-14">
        <div className="container mx-auto px-6 max-w-6xl">
          {loading ? (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-10 w-44" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicleSkeletons.map((_, index) => (
                  <div key={index} className="h-full">
                    <VehicleCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ) : error && vehicles.length === 0 ? (
            <div className="space-y-6">
              <Alert
                type="error"
                title="Chargement impossible"
                message={error}
              />
              <div className="flex justify-center">
                <Button onClick={loadData}>Reessayer</Button>
              </div>
            </div>
          ) : vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="Aucun vehicule trouve"
              message="Modifiez vos criteres de recherche pour trouver le vehicule parfait"
              action={<Button onClick={resetFilters}>Reinitialiser les filtres</Button>}
            />
          ) : (
            <>
              <div className="mb-8">
                {error && (
                  <div className="mb-5">
                    <Alert type="warning" title="Resultats partiellement indisponibles" message={error} />
                  </div>
                )}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-slate-900 text-lg font-semibold tracking-tight">{pagination.totalItems} vehicule(s) disponible(s)</p>
                    {filters.startDate && filters.endDate && (
                      <p className="text-sm text-slate-500 mt-1">Disponibilite verifiee du {filters.startDate} au {filters.endDate}</p>
                    )}
                    {isRefreshing && (
                      <p className="text-sm text-primary-700 mt-1">Mise a jour des resultats...</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm font-medium text-slate-600">Trier par</label>
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => {
                        const nextSort = e.target.value;
                        setSortBy(nextSort);
                        syncUrlState(filters, pagination.page, nextSort);
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                    >
                      <option value="newest">Plus recents</option>
                      <option value="oldest">Plus anciens</option>
                      <option value="priceAsc">Prix croissant</option>
                      <option value="priceDesc">Prix decroissant</option>
                    </select>
                  </div>
                </div>

                {activeChips.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={() => removeFilter(chip.key)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <span>{chip.label}</span>
                        <span className="text-slate-600">x</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="h-full">
                    <VehicleCard
                      vehicle={vehicle}
                      initialIsLiked={favoriteIds.has(vehicle.id)}
                      skipFavoriteCheck={isAuthenticated}
                      onFavoriteChange={handleFavoriteChange}
                    />
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage || isRefreshing}
                  >
                    Precedent
                  </Button>
                  <span className="text-sm font-medium text-slate-700">
                    Page {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage || isRefreshing}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default VehiclesPage;
