import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Plus, Edit, Trash2, Search, AlertCircle, CheckCircle, 
  Loader, Grid, List, TrendingUp, Zap
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuthContext } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/UI';
import ConfirmModal from '../../components/ConfirmModal';
import { Card, Button, Badge, InputField, EmptyState, Loading, Alert } from '../../components/UI';

function AdminCategories() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null, categoryName: '' });
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadCategories();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const filtered = categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAllCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur chargement catÈgories:', error);
      setError('Erreur lors du chargement des catÈgories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name.trim()) {
      setError('Le nom de la catÈgorie est obligatoire');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
        setSuccess('úÖ CatÈgorie mise ‡ jour avec succËs');
      } else {
        await adminService.createCategory(formData);
        setSuccess('úÖ CatÈgorie crÈÈe avec succËs');
      }
      setTimeout(() => {
        loadCategories();
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'opÈration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (category) => {
    setDeleteModal({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      setError('');
      await adminService.deleteCategory(deleteModal.categoryId);
      setSuccess('úÖ CatÈgorie supprimÈe avec succËs');
      setTimeout(() => {
        loadCategories();
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Erreur suppression:', error);
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const getVehicleCount = (category) => category.vehicles?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">\n<main className="py-8">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestion des catÈgories</h1>
            <p className="text-slate-600">Administrez les catÈgories de vÈhicules</p>
          </div>

          {/* Notifications */}
          {success && <Alert type="success" message={success} icon={CheckCircle} className="mb-6" />}
          {error && <Alert type="error" message={error} icon={AlertCircle} className="mb-6" />}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <Card className="p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <InputField
                      placeholder="Rechercher par nom ou description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={Search}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'outline'}
                      size="md"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'outline'}
                      size="md"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button onClick={() => handleOpenModal()} size="md">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle catÈgorie
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total des catÈgories</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{categories.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">RÈsultats de recherche</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{filteredCategories.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">VÈhicules total</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {categories.reduce((sum, c) => sum + getVehicleCount(c), 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Categories Display */}
              {filteredCategories.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Aucune catÈgorie trouvÈe"
                  message={searchTerm ? "Aucune catÈgorie ne correspond ‡ votre recherche" : "Aucune catÈgorie disponible"}
                  action={!searchTerm && <Button onClick={() => handleOpenModal()}>CrÈer une catÈgorie</Button>}
                />
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCategories.map((category, index) => (
                        <Card
                          key={category.id}
                          hover
                          className="overflow-hidden flex flex-col animate-fadeIn"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="p-6 flex-1 flex flex-col">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-primary-600" />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenModal(category)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="error"
                                  onClick={() => handleDeleteClick(category)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Info */}
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{category.name}</h3>
                            <p className="text-slate-600 text-sm flex-1 mb-4">
                              {category.description || 'Pas de description'}
                            </p>

                            {/* Footer */}
                            <div className="pt-4 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600 uppercase">VÈhicules</span>
                                <Badge variant="info">{getVehicleCount(category)}</Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase">CatÈgorie</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase">Description</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-900 uppercase">VÈhicules</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-900 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCategories.map((category, idx) => (
                            <tr
                              key={category.id}
                              className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-primary-600" />
                                  </div>
                                  <span className="font-semibold text-slate-900">{category.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 text-sm">
                                {category.description || '-'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="info" size="sm">
                                  {getVehicleCount(category)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenModal(category)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="error"
                                    onClick={() => handleDeleteClick(category)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-fadeIn">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingCategory ? 'úèÔ∏è Modifier la catÈgorie' : 'ú® Nouvelle catÈgorie'}
              </h2>

              {error && <Alert type="error" message={error} icon={AlertCircle} className="mb-4" />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Nom de la catÈgorie *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: SUV, Berline, Monospace..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="DÈcrivez cette catÈgorie..."
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {editingCategory ? 'Mettre ‡ jour' : 'CrÈer'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}
        onConfirm={handleDeleteConfirm}
        title="ö†Ô∏è Supprimer la catÈgorie"
        message={` tes-vous s˚r de vouloir supprimer "${deleteModal.categoryName}" ? Cette action est irrÈversible.`}
        loading={deleting}
      />
    </div>
  );
}

export default AdminCategories;



