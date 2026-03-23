import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Plus, Edit, Trash2, Eye, Search, Filter, Fuel, Calendar } from 'lucide-react';
import { managerService } from '../../services/managerService';
import { vehicleService } from '../../services/vehicleService';
import { AuthContext } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/UI';
import ConfirmModal from '../../components/ConfirmModal';
import { API_BASE_URL } from '../../services/api';

const VehicleCard = ({ vehicle, onDelete }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
      <div className="h-56 relative overflow-hidden bg-slate-100">
        {vehicle.images && vehicle.images.length > 0 ? (
          <img
            src={`${API_BASE_URL}${vehicle.images[0]}`}
            alt={`${vehicle.brand} ${vehicle.model}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <Car className="w-16 h-16 mb-2" />
            <span className="text-sm font-medium">Aucune image</span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
              vehicle.isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-slate-900/90 text-white'
            }`}
          >
            {vehicle.isAvailable ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-slate-500 font-medium">{vehicle.category?.name || 'Non classe'}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-blue-600">
              {parseFloat(vehicle.pricePerDay).toLocaleString()}{' '}
              <span className="text-xs font-bold text-slate-400 uppercase">FCFA/j</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 my-4">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <Fuel className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700 capitalize">{vehicle.fuelType || 'Essence'}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
          <Link
            to={`/vehicles/${vehicle.id}`}
            className="flex-1 flex items-center justify-center p-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Voir fiche publique"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/manager/vehicles/edit/${vehicle.id}`}
            className="flex-1 flex items-center justify-center p-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 hover:text-indigo-600 transition-colors"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(vehicle)}
            className="flex-1 flex items-center justify-center p-2.5 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function ManagerVehicles() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    vehicleId: null,
    vehicleName: ''
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'manager' && user?.role !== 'admin')) {
      navigate('/login');
      return;
    }
    loadVehicles();
  }, [isAuthenticated, user, navigate]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await managerService.getAgencyVehicles();
      setVehicles(response.data);
    } catch (error) {
      console.error('Erreur chargement vehicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (vehicle) => {
    setDeleteModal({
      isOpen: true,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model}`
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      const response = await vehicleService.deleteVehicle(deleteModal.vehicleId);

      if (response.success) {
        loadVehicles();
        setDeleteModal({ isOpen: false, vehicleId: null, vehicleName: '' });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Mes vehicules</h1>
            <p className="text-slate-500 font-medium">Gerez votre flotte et ses disponibilites</p>
          </div>
          <Link
            to="/manager/vehicles/add"
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un vehicule</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un vehicule (marque, modele)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm text-sm font-medium"
            />
          </div>
          <button className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filtres</span>
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onDelete={handleDeleteClick} />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le vehicule"
        message={`Etes-vous sur de vouloir supprimer "${deleteModal.vehicleName}" ?`}
        loading={deleting}
      />
    </div>
  );
}

export default ManagerVehicles;
