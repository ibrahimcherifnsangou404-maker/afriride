import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function AdminMenu() {
  const { user } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-gray-800">AfriRide Admin</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-primary">
              Dashboard
            </Link>
            <Link to="/admin/agencies" className="text-gray-600 hover:text-primary">
              Agences
            </Link>
            <Link to="/admin/categories" className="text-gray-600 hover:text-primary">
              Catégories
            </Link>
            <Link to="/admin/users" className="text-gray-600 hover:text-primary">
              Utilisateurs
            </Link>
            <Link to="/admin/reviews" className="text-gray-600 hover:text-primary">
              Avis
            </Link>
            <Link to="/admin/promo-codes" className="text-gray-600 hover:text-primary">
              Codes promo
            </Link>

            <span className="text-gray-600">{user?.firstName}</span>
          </div>
        </div>
      </nav>
    </header>
  );
}

