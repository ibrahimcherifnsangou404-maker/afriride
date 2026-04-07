import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Users,
  TicketCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  MessageCircle,
  Eye,
  Receipt,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import logo from '../../assets/afriride-logo.png';

export default function AdminNav() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navRef = useRef(null);
  const { unreadCount } = useUnreadMessages({ enabled: true });

  const isActive = (path) => location.pathname.startsWith(path);

  const primaryNav = [
    { label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { label: 'Agences', icon: Building2, path: '/admin/agencies' },
    { label: 'Utilisateurs', icon: Users, path: '/admin/users' }
  ];

  const secondaryNav = [
    { label: 'KYC agences', icon: ShieldCheck, path: '/admin/agencies/kyc' },
    { label: 'Messagerie', icon: MessageCircle, path: '/messages' },
    { label: 'Signalements', icon: AlertTriangle, path: '/admin/message-reports' },
    { label: 'KYC', icon: AlertCircle, path: '/admin/kyc' },
    { label: 'Categories', icon: TicketCheck, path: '/admin/categories' },
    { label: 'Avis', icon: MessageSquare, path: '/admin/reviews' },
    { label: 'Codes promo', icon: Eye, path: '/admin/promo-codes' },
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
            <Link to="/admin/dashboard" className="flex items-center space-x-2 flex-shrink-0 group">
              <img src={logo} alt="AfriRide Admin" className="h-9 w-auto object-contain transform group-hover:scale-105 transition-transform" />
              <span className="text-xl font-bold text-slate-900 hidden sm:inline">Admin</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {primaryNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                    isActive(item.path) ? 'bg-slate-900/10 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
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
                  aria-controls="admin-more-menu"
                  className="px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 flex items-center space-x-1"
                >
                  <span>Plus</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {moreOpen && (
                  <div id="admin-more-menu" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
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
              <Link to="/admin/users/create-manager" className="hidden md:inline-flex">
                <button className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm inline-flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>Creer manager</span>
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
                  aria-controls="admin-profile-menu"
                  className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white text-sm font-bold">
                    {user?.firstName?.[0] || 'A'}
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
                </button>

                {profileOpen && (
                  <div id="admin-profile-menu" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="text-xs text-slate-600 mt-1">Administrator</p>
                    </div>
                    <Link to="/admin/settings" className="flex items-center space-x-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Parametres systeme</span>
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
                aria-controls="admin-mobile-menu"
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div id="admin-mobile-menu" className="md:hidden bg-white border-t border-slate-200 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/admin/users/create-manager"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                Creer manager
              </Link>

              {[...primaryNav, ...secondaryNav].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.path) ? 'bg-slate-900/10 text-slate-900 font-semibold' : 'text-slate-600'
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
