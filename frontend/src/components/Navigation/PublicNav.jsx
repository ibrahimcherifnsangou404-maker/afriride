import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Menu, X, LogIn, UserPlus, Building2 } from 'lucide-react';

export default function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-green-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent hidden sm:inline">
              AfriRide
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive('/') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Accueil
            </Link>
            <Link
              to="/vehicles"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive('/vehicles') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Vehicules
            </Link>
            <Link
              to="/partner-signup"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1 ${
                isActive('/partner-signup') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Agences
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="hidden md:flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Connexion</span>
            </Link>

            <Link
              to="/vehicles"
              className="hidden md:flex items-center space-x-1 px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <span>Reserver</span>
            </Link>

            <Link
              to="/register"
              className="hidden lg:flex items-center space-x-1 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Inscription</span>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-menu"
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="public-mobile-menu" className="md:hidden border-t border-slate-200 py-4 space-y-2">
            <Link
              to="/vehicles"
              className="block mx-4 mb-3 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-center"
              onClick={() => setMobileOpen(false)}
            >
              Reserver
            </Link>
            <Link
              to="/"
              className="block px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Accueil
            </Link>
            <Link
              to="/vehicles"
              className="block px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Vehicules
            </Link>
            <Link
              to="/partner-signup"
              className="block px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Devenir partenaire
            </Link>
            <div className="px-4 py-2 space-y-2">
              <Link
                to="/login"
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-all w-full"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                <span>Connexion</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium transition-all w-full hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
              >
                <UserPlus className="w-4 h-4" />
                <span>Inscription</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
