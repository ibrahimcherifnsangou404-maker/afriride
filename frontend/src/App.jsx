import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { setNavigateRef } from './utils/navigate';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import CookieConsentBanner from './components/CookieConsentBanner';
import PageLoader from './components/PageLoader';
import PageTransition from './components/PageTransition';
import { loadCookieConsentFromServer } from './services/cookieConsentService';

// ── Public Pages (lazy loaded) ──────────────────────────────────────────────
const HomePage              = lazy(() => import('./pages/HomePage'));
const RegisterPage          = lazy(() => import('./pages/RegisterPage'));
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const PartnerSignupPage     = lazy(() => import('./pages/PartnerSignupPage'));
const VehiclesPage          = lazy(() => import('./pages/VehiclesPage'));
const VehicleDetailPage     = lazy(() => import('./pages/VehicleDetailPage'));
const TermsPage             = lazy(() => import('./pages/TermsPage'));
const PrivacyPolicyPage     = lazy(() => import('./pages/PrivacyPolicyPage'));
const CookiePolicyPage      = lazy(() => import('./pages/CookiePolicyPage'));
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage     = lazy(() => import('./pages/ResetPasswordPage'));
const EmailConfirmationPage = lazy(() => import('./pages/EmailConfirmationPage'));

// ── Client Pages (lazy loaded) ──────────────────────────────────────────────
const MyBookingsPage   = lazy(() => import('./pages/MyBookingsPage'));
const MyLoyaltyPoints  = lazy(() => import('./pages/MyLoyaltyPoints'));
const ContractPage     = lazy(() => import('./pages/ContractPage'));
const PaymentPage      = lazy(() => import('./pages/PaymentPage'));
const InvoicesPage     = lazy(() => import('./pages/InvoicesPage'));
const KYCPage          = lazy(() => import('./pages/KYCPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));
const FavoritesPage    = lazy(() => import('./pages/FavoritesPage'));
const MessagesPage     = lazy(() => import('./pages/MessagesPage'));

// ── Manager Pages (lazy loaded) ─────────────────────────────────────────────
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerVehicles  = lazy(() => import('./pages/manager/ManagerVehicles'));
const ManagerBookings  = lazy(() => import('./pages/manager/ManagerBookings'));
const ManagerKYC       = lazy(() => import('./pages/manager/ManagerKYC'));
const ManagerAgencyKYC = lazy(() => import('./pages/manager/ManagerAgencyKYC'));
const ManagerContractPolicy = lazy(() => import('./pages/manager/ManagerContractPolicy'));
const ManagerRevenue   = lazy(() => import('./pages/manager/ManagerRevenue'));
const AddVehicle       = lazy(() => import('./pages/manager/AddVehicle'));
const EditVehicle      = lazy(() => import('./pages/manager/EditVehicle'));

// ── Admin Pages (lazy loaded) ────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAgencies       = lazy(() => import('./pages/admin/AdminAgencies'));
const AdminAgencyKyc      = lazy(() => import('./pages/admin/AdminAgencyKyc'));
const AdminCategories     = lazy(() => import('./pages/admin/AdminCategories'));
const AdminUsers          = lazy(() => import('./pages/admin/AdminUsers'));
const CreateManager       = lazy(() => import('./pages/admin/CreateManager'));
const AdminReviews        = lazy(() => import('./pages/admin/AdminReviews'));
const AdminPromoCodes     = lazy(() => import('./pages/admin/AdminPromoCodes'));
const AdminMessageReports = lazy(() => import('./pages/admin/AdminMessageReports'));

// ── Inner wrapper so PageTransition can use useLocation inside <Router> ──────
function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  // Enregistre navigate dans le singleton pour que les intercepteurs Axios
  // puissent rediriger sans hard reload (ex: erreur 401)
  useEffect(() => {
    setNavigateRef(navigate);
  }, [navigate]);

  // Ameliore la fluidite de navigation: nouvelle page demarre en haut.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return (
    <Suspense fallback={<PageLoader />}>
      <PageTransition>
        <Routes location={location}>
          {/* Routes publiques */}
          <Route path="/"                        element={<HomePage />} />
          <Route path="/register"                element={<RegisterPage />} />
          <Route path="/login"                   element={<LoginPage />} />
          <Route path="/confirm-email"           element={<EmailConfirmationPage />} />
          <Route path="/confirm-email/:token"    element={<EmailConfirmationPage />} />
          <Route path="/partner-signup"          element={<PartnerSignupPage />} />
          <Route path="/conditions-utilisation"  element={<TermsPage />} />
          <Route path="/politique-confidentialite" element={<PrivacyPolicyPage />} />
          <Route path="/politique-cookies"       element={<CookiePolicyPage />} />
          <Route path="/forgot-password"         element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token"   element={<ResetPasswordPage />} />
          <Route path="/vehicles"                element={<VehiclesPage />} />
          <Route path="/vehicles/:id"            element={<VehicleDetailPage />} />

          {/* Routes Client */}
          <Route path="/my-bookings" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <MyBookingsPage />
            </ProtectedRoute>
          }/>
          <Route path="/my-loyalty-points"  element={<MyLoyaltyPoints />} />
          <Route path="/favorites" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <FavoritesPage />
            </ProtectedRoute>
          }/>
          <Route path="/contracts/:id" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <ContractPage />
            </ProtectedRoute>
          }/>
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <PaymentPage />
            </ProtectedRoute>
          }/>
          <Route path="/invoices" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <InvoicesPage />
            </ProtectedRoute>
          }/>
          <Route path="/kyc" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <KYCPage />
            </ProtectedRoute>
          }/>
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }/>
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }/>
          <Route path="/messages" element={
            <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
              <MessagesPage />
            </ProtectedRoute>
          }/>

          {/* Routes Manager */}
          <Route path="/manager/dashboard" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/manager/vehicles" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerVehicles />
            </ProtectedRoute>
          }/>
          <Route path="/manager/vehicles/add" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <AddVehicle />
            </ProtectedRoute>
          }/>
          <Route path="/manager/vehicles/edit/:id" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <EditVehicle />
            </ProtectedRoute>
          }/>
          <Route path="/manager/bookings" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerBookings />
            </ProtectedRoute>
          }/>
          <Route path="/admin/kyc" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManagerKYC />
            </ProtectedRoute>
          }/>
          <Route path="/manager/revenue" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerRevenue />
            </ProtectedRoute>
          }/>
          <Route path="/manager/agency-kyc" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerAgencyKYC />
            </ProtectedRoute>
          }/>
          <Route path="/manager/contract-policy" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerContractPolicy />
            </ProtectedRoute>
          }/>

          {/* Routes Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/admin/agencies" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAgencies />
            </ProtectedRoute>
          }/>
          <Route path="/admin/agencies/kyc" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAgencyKyc />
            </ProtectedRoute>
          }/>
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCategories />
            </ProtectedRoute>
          }/>
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }/>
          <Route path="/admin/users/create-manager" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateManager />
            </ProtectedRoute>
          }/>
          <Route path="/admin/reviews" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReviews />
            </ProtectedRoute>
          }/>
          <Route path="/admin/message-reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMessageReports />
            </ProtectedRoute>
          }/>
          <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
        </Routes>
      </PageTransition>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    loadCookieConsentFromServer();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Navigation />
          <div className="min-h-screen bg-slate-50">
            <AppRoutes />
          </div>
          <CookieConsentBanner />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
