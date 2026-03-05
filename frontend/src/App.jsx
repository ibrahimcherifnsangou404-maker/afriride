import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PartnerSignupPage from './pages/PartnerSignupPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import MyBookingsPage from './pages/MyBookingsPage';
import MyLoyaltyPoints from './pages/MyLoyaltyPoints';
import ContractPage from './pages/ContractPage';
import KYCPage from './pages/KYCPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FavoritesPage from './pages/FavoritesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import MessagesPage from './pages/MessagesPage';

import PaymentPage from './pages/PaymentPage';
import InvoicesPage from './pages/InvoicesPage';

// Manager
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerVehicles from './pages/manager/ManagerVehicles';
import ManagerBookings from './pages/manager/ManagerBookings';
import ManagerKYC from './pages/manager/ManagerKYC';
import ManagerRevenue from './pages/manager/ManagerRevenue';
import AddVehicle from './pages/manager/AddVehicle';
import EditVehicle from './pages/manager/EditVehicle';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAgencies from './pages/admin/AdminAgencies';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';
import CreateManager from './pages/admin/CreateManager';
import AdminReviews from './pages/admin/AdminReviews';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <div className="min-h-screen bg-slate-50">
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/confirm-email/:token" element={<EmailConfirmationPage />} />
            <Route path="/partner-signup" element={<PartnerSignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />

            {/* Routes Client */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/my-loyalty-points" element={<MyLoyaltyPoints />} />

            {/* Routes Favoris */}
            <Route
              path="/favorites"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />

            {/* Routes Contrats */}
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <ContractPage />
                </ProtectedRoute>
              }
            />

            {/* Routes Paiement */}
            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kyc"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <KYCPage />
                </ProtectedRoute>
              }
            />

            {/* Routes Profil & Paramètres */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute allowedRoles={['client', 'manager', 'admin']}>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Routes Manager */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/vehicles"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/vehicles/add"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <AddVehicle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/vehicles/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <EditVehicle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/bookings"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/kyc"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerKYC />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manager/revenue"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerRevenue />
                </ProtectedRoute>
              }
            />

            {/* Routes Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agencies"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAgencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/create-manager"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReviews />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
