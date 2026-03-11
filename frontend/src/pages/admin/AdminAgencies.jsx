import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Building2, Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuthContext } from '../../context/AuthContext';
import { Skeleton } from '../../components/UI';
import ConfirmModal from '../../components/ConfirmModal';

function AdminAgencies() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, agencyId: null, agencyName: '' });
  const [deleting, setDeleting] = useState(false);
  const [focusedAgencyId, setFocusedAgencyId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadAgencies();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusId = params.get('focus');
    if (!focusId || !agencies.length) return;

    setFocusedAgencyId(focusId);
    const target = document.getElementById(`agency-card-${focusId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timer = setTimeout(() => setFocusedAgencyId(''), 2500);
    return () => clearTimeout(timer);
  }, [location.search, agencies]);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllAgencies();
      setAgencies(response.data);
    } catch (error) {
      console.error('Erreur chargement agences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (agency = null) => {
    // Seulement modifier les agences existantes, pas créer de nouvelles
    if (agency) {
      setEditingAgency(agency);
      setFormData({
        name: agency.name,
        description: agency.description || '',
        address: agency.address,
        phone: agency.phone,
        email: agency.email
      });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgency(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAgency) {
        await adminService.updateAgency(editingAgency.id, formData);
        alert('Agence mise à jour avec succès');
      } else {
        await adminService.createAgency(formData);
        alert('Agence créée avec succès');
      }
      loadAgencies();
      handleCloseModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  const handleDeleteClick = (agency) => {
    setDeleteModal({
      isOpen: true,
      agencyId: agency.id,
      agencyName: agency.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await adminService.deleteAgency(deleteModal.agencyId);
      loadAgencies();
      setDeleteModal({ isOpen: false, agencyId: null, agencyName: '' });
      alert('Agence supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}\n{/* Contenu */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des agences</h1>
            <p className="text-gray-600">Gérez toutes les agences partenaires</p>
            <p className="text-sm text-gray-500 mt-2">Les nouvelles agences sont créées via "Devenir Partenaire"</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg p-6 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-9 w-28" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency) => (
              <div
                id={`agency-card-${agency.id}`}
                key={agency.id}
                className={`bg-white rounded-lg shadow-lg p-6 transition-all duration-300 ${
                  focusedAgencyId === agency.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-3 rounded-full mr-3">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{agency.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        agency.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{agency.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {agency.address}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    {agency.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-primary" />
                    {agency.email}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{agency.vehicles?.length || 0}</span> véhicules
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(agency)}
                      className="p-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(agency)}
                      className="p-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Modifier l'agence
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'agence *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 font-semibold"
                  >
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, agencyId: null, agencyName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'agence"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.agencyName}" ? Cette action est irréversible.`}
        loading={deleting}
      />
    </div>
  );
}

export default AdminAgencies;



