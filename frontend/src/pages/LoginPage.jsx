import { useEffect, useState, useContext } from 'react';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  AlertCircle,
  LogIn,
  Loader,
  Eye,
  EyeOff,
  Github
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Alert } from '../components/UI';
import logo from '../assets/afriride-logo.png';

function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!googleClientId) {
      setGoogleError('Connexion Google indisponible (client ID manquant).');
      return;
    }

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response?.credential) {
            setGoogleError('Impossible de récupérer le token Google.');
            return;
          }
          const result = await googleLogin(response.credential);
          if (result.success) {
            const userRole = result.data.role;
            switch (userRole) {
              case 'admin':
                navigate('/admin/dashboard');
                break;
              case 'manager':
                navigate('/manager/dashboard');
                break;
              case 'client':
              default:
                navigate('/');
                break;
            }
          } else {
            setGoogleError(result.message);
          }
        }
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with'
      });
      setGoogleReady(true);
    };

    if (window.google && googleBtnRef.current) {
      initGoogle();
      return;
    }

    const existingScript = document.querySelector('script[data-google-identity]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-identity', 'true');
    script.onload = initGoogle;
    script.onerror = () => setGoogleError('Chargement Google impossible.');
    document.head.appendChild(script);
  }, [googleClientId, googleLogin, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: ''
    }));
    setError('');
  };

  const validate = () => {
    const nextErrors = { email: '', password: '' };
    const emailOk = /\S+@\S+\.\S+/.test(formData.email);
    if (!emailOk) {
      nextErrors.email = 'Email invalide.';
    }
    if (!formData.password || formData.password.length < 8) {
      nextErrors.password = 'Au moins 8 caractères.';
    }
    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      const userRole = result.data.role;
      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'manager':
          navigate('/manager/dashboard');
          break;
        case 'client':
        default:
          navigate('/');
          break;
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                <img src={logo} alt="AfriRide" className="w-full h-full object-contain" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                AfriRide
              </div>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Connexion</h1>
            <p className="mt-2 text-sm text-slate-600">
              Accédez à votre compte en toute sécurité.
            </p>
          </div>

          {error && (
            <div className="mb-6" aria-live="polite">
              <Alert type="error" message={error} icon={AlertCircle} />
            </div>
          )}
          {googleError && (
            <div className="mb-6" aria-live="polite">
              <Alert type="error" message={googleError} icon={AlertCircle} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-800">
                Email
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.email
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-slate-200 focus:border-indigo-500'
                  }`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-xs text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-800">
                Mot de passe
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Minimum 8 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.password
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-slate-200 focus:border-indigo-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-xs text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Se souvenir de moi
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Mot de passe oublié
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  Connexion en cours...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Se connecter
                </span>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium text-slate-500">
                Continuer avec
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2 shadow-sm ${googleReady ? '' : 'opacity-60'}`}>
              <div ref={googleBtnRef} />
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Github className="h-5 w-5" />
              GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            En continuant, vous acceptez nos{' '}
            <Link to="/conditions-utilisation" className="text-indigo-600 hover:text-indigo-700">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link to="/politique-confidentialite" className="text-indigo-600 hover:text-indigo-700">
              politique de confidentialité
            </Link>.
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          Pas encore de compte?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
