import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Footer } from '../components/Layout/Footer';
import { Card, Button, InputField, Alert } from '../components/UI';
import logo from '../assets/afriride-logo.png';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName) {
        setError('Veuillez entrer votre prénom et nom');
        return false;
      }
    } else if (step === 2) {
      if (!formData.email || !formData.phone) {
        setError('Veuillez entrer votre email et téléphone');
        return false;
      }
      if (!isValidEmail(formData.email)) {
        setError('Veuillez entrer un email valide');
        return false;
      }
    } else if (step === 3) {
      if (!formData.password || !formData.confirmPassword) {
        setError('Veuillez entrer un mot de passe');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) {
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        navigate('/confirm-email', {
          state: {
            email: formData.email.trim().toLowerCase()
          }
        });
      } else {
        setError(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4 border border-slate-200">
              <img src={logo} alt="AfriRide" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">AfriRide</h1>
            <p className="text-slate-600 mt-2">Créer votre compte</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 mx-1">
                <div
                  className={`h-2 rounded-full transition-all ${
                    s <= step
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700'
                      : 'bg-slate-200'
                  }`}
                ></div>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card className="p-8 space-y-6">
            {error && (
              <Alert type="error" message={error} icon={AlertCircle} />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Informations personnelles */}
              {step === 1 && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Informations personnelles</h2>
                  <InputField
                    label="Prénom"
                    name="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleChange}
                    icon={User}
                    required
                  />
                  <InputField
                    label="Nom"
                    name="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange}
                    icon={User}
                    required
                  />
                </>
              )}

              {/* Step 2: Coordonnées */}
              {step === 2 && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Vos coordonnées</h2>
                  <InputField
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Mail}
                    required
                  />
                  <InputField
                    label="Téléphone"
                    type="tel"
                    name="phone"
                    placeholder="+237 XXX XXX XXX"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={Phone}
                    required
                  />
                </>
              )}

              {/* Step 3: Mot de passe et rôle */}
              {step === 3 && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Sécurité et rôle</h2>
                  <InputField
                    label="Mot de passe"
                    type="password"
                    name="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                    icon={Lock}
                    required
                  />
                  <InputField
                    label="Confirmer le mot de passe"
                    type="password"
                    name="confirmPassword"
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={Lock}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type de compte</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900"
                    >
                      <option value="client">Client</option>
                      <option value="manager">Manager d'agence</option>
                    </select>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => setStep(step - 1)}
                  >
                    Retour
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  size="md"
                  className={step > 1 ? 'flex-1' : 'w-full'}
                >
                  {loading ? 'Traitement...' : step === 3 ? 'S\'inscrire' : 'Suivant'}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Ou</span>
              </div>
            </div>

            {/* Login Link */}
            <Link to="/login">
              <Button
                variant="outline"
                size="md"
                className="w-full"
              >
                Déjà inscrit ? Se connecter
              </Button>
            </Link>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default RegisterPage;


