import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Users, Mail, Phone, Building2,Plus  } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuthContext } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/UI';

function AdminUsers() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [isAuthenticated, user, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Gestionnaire';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    return u.role === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}\n{/* Contenu */}
      <div className="container mx-auto px-6 py-8">
       <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des utilisateurs</h1>
           <p className="text-gray-600">Liste de tous les utilisateurs de la plateforme</p>
        </div>
        <Link
         to="/admin/users/create-manager"
         className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
        >
         <Plus className="w-5 h-5" />
         <span>Créer un gestionnaire</span>
        </Link>
       </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setFilter('client')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'client'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Clients ({users.filter(u => u.role === 'client').length})
            </button>
            <button
              onClick={() => setFilter('manager')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'manager'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gestionnaires ({users.filter(u => u.role === 'manager').length})
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'admin'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admins ({users.filter(u => u.role === 'admin').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <TableSkeleton rows={7} columns={6} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Utilisateur</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rôle</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Agence</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {u.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {u.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(u.role)}`}>
                          {getRoleText(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.agency ? (
                          <div className="flex items-center text-sm text-gray-700">
                            <Building2 className="w-4 h-4 mr-2 text-primary" />
                            {u.agency.name}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          u.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {u.isVerified ? 'Vérifié' : 'Non vérifié'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;


