import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import logo from '../../assets/afriride-logo.svg';

export function Header() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-slate-200">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-lg group-hover:shadow-premium transition-shadow">
              <img src={logo} alt="AfriRide" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              AfriRide
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link
                  to="/vehicles"
                  className={`font-medium transition-colors ${
                    isActive('/vehicles')
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-slate-600 hover:text-primary-600'
                  }`}
                >
                  Véhicules
                </Link>
                <Link
                  to="/my-bookings"
                  className={`font-medium transition-colors ${
                    isActive('/my-bookings')
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-slate-600 hover:text-primary-600'
                  }`}
                >
                  Réservations
                </Link>
                <div className="flex items-center space-x-4 pl-8 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{user?.firstName}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-medium text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-premium font-medium transition-all"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/vehicles"
                  className="block font-medium text-slate-600 hover:text-primary-600 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Véhicules
                </Link>
                <Link
                  to="/my-bookings"
                  className="block font-medium text-slate-600 hover:text-primary-600 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Réservations
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left inline-flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block font-medium text-slate-600 hover:text-primary-600 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="block font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg px-4 py-2 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

