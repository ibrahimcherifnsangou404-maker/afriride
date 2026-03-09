import { MapPin, Mail, Phone, Linkedin, Twitter, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/afriride-logo.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-700/40 shadow-lg">
                <img src={logo} alt="AfriRide" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold">AfriRide</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              La plateforme de location de véhicules de confiance en Afrique. Excellence, sécurité et commodité.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/vehicles" className="text-slate-400 hover:text-primary-400 transition-colors">
                  Véhicules
                </Link>
              </li>
              <li>
                <Link to="/partner-signup" className="text-slate-400 hover:text-primary-400 transition-colors">
                  Devenir partenaire
                </Link>
              </li>
              <li>
                <Link to="/" className="text-slate-400 hover:text-primary-400 transition-colors">
                  Accueil
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-slate-400">
                <Phone className="w-4 h-4 mr-2 text-primary-500" />
                +237 XXX XXX XXX
              </li>
              <li className="flex items-center text-slate-400">
                <Mail className="w-4 h-4 mr-2 text-primary-500" />
                <a href="mailto:contact@afriride.com" className="hover:text-primary-400 transition-colors">
                  contact@afriride.com
                </a>
              </li>
              <li className="flex items-center text-slate-400">
                <MapPin className="w-4 h-4 mr-2 text-primary-500" />
                Yaoundé, Cameroun
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/conditions-utilisation" className="text-slate-400 hover:text-primary-400 transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/politique-confidentialite" className="text-slate-400 hover:text-primary-400 transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/politique-cookies" className="text-slate-400 hover:text-primary-400 transition-colors">
                  Politique de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Réseaux sociaux</h3>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>&copy; {currentYear} AfriRide. Tous droits réservés.</p>
            <p>Conçu avec ¤ï¸ pour l'Afrique</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

