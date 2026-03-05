import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import UserNav from './UserNav';
import ManagerNav from './ManagerNav';
import AdminNav from './AdminNav';
import PublicNav from './PublicNav';

/**
 * Navigation wrapper intelligent
 * Sélectionne automatiquement la bonne navigation selon le rôle utilisateur
 * 
 * Règles UX/UI:
 * - Chaque profil connecté dispose d'un menu dédié et permanent (Règle 6)
 * - Navigation claire, visible et accessible à tout moment
 * - Aucun écran sans point d'accès au reste de l'application
 */
export default function Navigation() {
  const { user, isAuthenticated } = useContext(AuthContext);

  // Navigation publique si non connecté
  if (!isAuthenticated) {
    return <PublicNav />;
  }

  // Navigation selon le rôle
  switch (user?.role) {
    case 'admin':
      return <AdminNav />;
    case 'manager':
      return <ManagerNav />;
    case 'client':
    default:
      return <UserNav />;
  }
}

