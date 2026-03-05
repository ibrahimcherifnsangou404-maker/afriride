import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Car, Plus, Edit, Trash2, Tag, TrendingUp, Calendar, 
  Check, X, Eye, Users, DollarSign 
} from 'lucide-react';
import { promoCodeService } from '../../services/promoCodeService';
import { AuthContext } from '../../context/AuthContext';

function AdminPromoCodes() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsagesModal, setShowUsagesModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [usages, setUsages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
    minAmount: ''
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadPromoCodes();
  }, [isAuthenticated, user, navigate]);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await promoCodeService.getAllPromoCodes();
      console.log('Codes promo reçus:', response.data);
      setPromoCodes(response.data || []);
    } catch (error) {
      console.error('Erreur chargement codes promo:', error);
      alert('Erreur lors du chargement des codes promo');
      setPromoCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discountValue) {
      alert('Le code et la valeur de réduction sont requis');
      return;
    }

    try {
      setSubmitting(true);

      const dataToSend = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expiresAt: formData.expiresAt || null,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null
      };

      const response = await promoCodeService.createPromoCode(dataToSend);

      if (response.success) {
        alert('œ… Code promo créé avec succès !');
        setShowCreateModal(false);
        resetForm();
        loadPromoCodes();
      }
    } catch (error) {
      console.error('Erreur création:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePromo = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const updates = {
        isActive: formData.isActive,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expiresAt: formData.expiresAt || null
      };

      const response = await promoCodeService.updatePromoCode(selectedPromo.id, updates);

      if (response.success) {
        alert('œ… Code promo mis à jour avec succès !');
        setShowEditModal(false);
        setSelectedPromo(null);
        loadPromoCodes();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromo = async (id, code) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le code "${code}" ?`)) {
      return;
    }

    try {
      await promoCodeService.deletePromoCode(id);
      alert('œ… Code promo supprimé avec succès !');
      loadPromoCodes();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleViewUsages = async (promo) => {
    try {
      setSelectedPromo(promo);
      const response = await promoCodeService.getPromoCodeUsages(promo.id);
      setUsages(response.data || []);
      setShowUsagesModal(true);
    } catch (error) {
      console.error('Erreur chargement utilisations:', error);
      alert('Erreur lors du chargement des utilisations');
    }
  };

  const handleEditClick = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      isActive: promo.isActive,
      maxUses: promo.maxUses || '',
      expiresAt: promo.expiresAt ? promo.expiresAt.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      expiresAt: '',
      minAmount: ''
    });
  };

  const getStatusBadge = (promo) => {
    if (!promo.isActive) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Inactif</span>;
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Expiré</span>;
    }
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">Épuisé</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Actif</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}\n<div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Codes promo</h1>
          <p className="text-gray-600">Gérez les codes promotionnels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Total codes</p>
              <Tag className="w-8 h-8 text-primary" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{promoCodes.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Codes actifs</p>
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {promoCodes.filter(p => p.isActive).length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Total utilisations</p>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {promoCodes.reduce((sum, p) => sum + (p.currentUses || 0), 0)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Codes expirés</p>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {promoCodes.filter(p => p.expiresAt && new Date(p.expiresAt) < new Date()).length}
            </p>
          </div>
        </div>

        {/* Liste des codes promo */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valeur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Utilisations</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Expiration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg">Aucun code promo</p>
                    <p className="text-sm">Créez votre premier code promo pour commencer</p>
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Tag className="w-5 h-5 text-primary mr-2" />
                        <span className="font-semibold text-gray-800">{promo.code || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {promo.discountType === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">
                      {promo.discountType === 'percentage' 
                        ? `${promo.discountValue || 0}%` 
                        : `${parseFloat(promo.discountValue || 0).toLocaleString()} FCFA`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {promo.currentUses || 0} {promo.maxUses ? `/ ${promo.maxUses}` : '/ ˆž'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {promo.expiresAt 
                        ? new Date(promo.expiresAt).toLocaleDateString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUsages(promo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Voir les utilisations"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(promo)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.id, promo.code)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Créer un code promo</h3>
              
              <form onSubmit={handleCreatePromo} className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code promo *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="NOEL2024"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary uppercase"
                    required
                  />
                </div>

                {/* Type de réduction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de réduction *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (FCFA)</option>
                  </select>
                </div>

                {/* Valeur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '10000'}
                    min="0"
                    step={formData.discountType === 'percentage' ? '1' : '100'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.discountType === 'percentage' ? 'Entre 0 et 100%' : 'Montant en FCFA'}
                  </p>
                </div>

                {/* Nombre max d'utilisations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre max d'utilisations (optionnel)
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="100"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Laisser vide pour illimité
                  </p>
                </div>

                {/* Date d'expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration (optionnel)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Montant minimum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant minimum de réservation (optionnel)
                  </label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="50000"
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Montant en FCFA
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Création...' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
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

      {/* Modal Modification */}
      {showEditModal && selectedPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Modifier {selectedPromo.code}
              </h3>
              
              <form onSubmit={handleUpdatePromo} className="space-y-4">
                {/* Statut */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="ml-3 text-gray-700 font-medium">Code actif</span>
                  </label>
                </div>

                {/* Max utilisations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre max d'utilisations
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Illimité"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Date d'expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Boutons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedPromo(null);
                    }}
                    disabled={submitting}
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

      {/* Modal Utilisations */}
      {showUsagesModal && selectedPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Utilisations de {selectedPromo.code}
                </h3>
                <button
                  onClick={() => {
                    setShowUsagesModal(false);
                    setSelectedPromo(null);
                    setUsages([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {usages.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">Aucune utilisation</p>
                  <p className="text-gray-500">Ce code n'a pas encore été utilisé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usages.map((usage) => (
                    <div key={usage.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-primary mr-2" />
                          <span className="font-semibold text-gray-800">
                            {usage.user?.firstName} {usage.user?.lastName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(usage.createdAt || usage.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{usage.user?.email}</span>
                        <span className="font-semibold text-green-600">
                          -{parseFloat(usage.discount || 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPromoCodes;


