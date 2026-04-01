import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Car,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  DollarSign,
  Receipt,
  PlusCircle,
  MessageCircle,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

export default function ManagerNav() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navRef = useRef(null);
  const { unreadCount } = useUnreadMessages({ enabled: true });

  const isActive = (path) => location.pathname.startsWith(path);

  const primaryNav = [
    { label: 'Dashboard', icon: BarChart3, path: '/manager/dashboard' },
    { label: 'Vehicules', icon: Car, path: '/manager/vehicles' },
    { label: 'Reservations', icon: Users, path: '/manager/bookings' }
  ];

  const secondaryNav = [
    { label: 'KYC agence', icon: ShieldCheck, path: '/manager/agency-kyc' },
    { label: 'Politique contrat', icon: FileText, path: '/manager/contract-policy' },
    { label: 'Messages', icon: MessageCircle, path: '/messages' },
    { label: 'Revenus', icon: DollarSign, path: '/manager/revenue' },
    { label: 'Factures', icon: Receipt, path: '/invoices' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileOpen(false);
        setProfileOpen(false);
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setProfileOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setMoreOpen(false);
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
    <>
      <nav ref={navRef} className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/manager/dashboard" className="flex items-center space-x-2 flex-shrink-0 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-slate-900">Manager</span>
                <p className="text-xs text-slate-500">{user?.agency?.name || 'Mon agence'}</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {primaryNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                    isActive(item.path) ? 'bg-blue-600/10 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  aria-label="Ouvrir les liens secondaires"
                  aria-expanded={moreOpen}
                  aria-controls="manager-more-menu"
                  className="px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 flex items-center space-x-1"
                >
                  <span>Plus</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {moreOpen && (
                  <div id="manager-more-menu" className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                    {secondaryNav.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center space-x-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link to="/manager/vehicles/add" className="hidden md:inline-flex">
                <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm inline-flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>Ajouter vehicule</span>
                </button>
              </Link>

              <Link to="/messages?filter=unread" className="hidden sm:block relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Ouvrir la messagerie">
                <span className="sr-only">Messages</span>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold inline-flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Ouvrir le menu profil"
                  aria-expanded={profileOpen}
                  aria-controls="manager-profile-menu"
                  className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                    {user?.firstName?.[0] || 'M'}
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
                </button>

                {profileOpen && (
                  <div id="manager-profile-menu" className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <Link to="/manager/settings" className="flex items-center space-x-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Parametres agence</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Deconnexion</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileOpen}
                aria-controls="manager-mobile-menu"
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div id="manager-mobile-menu" className="md:hidden bg-white border-t border-slate-200">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/manager/vehicles/add"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                Ajouter vehicule
              </Link>

              {[...primaryNav, ...secondaryNav].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.path) ? 'bg-blue-600/10 text-blue-600 font-semibold' : 'text-slate-600'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="h-16" />
    </>
  );
}
