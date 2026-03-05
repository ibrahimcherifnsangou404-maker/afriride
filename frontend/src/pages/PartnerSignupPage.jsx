import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, CheckCircle2, AlertCircle, Loader, 
  Building2, User, Phone, Mail, MapPin, FileText,
  ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { agencyService } from '../services/agencyService';

/**
 * PartnerSignupPage - Devenir Partenaire
 * 
 * OBJECTIF: Convertir les agences locales en partenaires AfriRide
 * ACTION PRINCIPALE: Soumettre candidature complète
 * 
 * STRUCTURE MULTI-STEP:
 * 1. Informations Agence
 * 2. Informations Manager (création compte)
 * 3. Confirmation & statut
 * 
 * UX/UI PRINCIPLES (10 REGLES):
 * - Guidance visuelle claire (progress bar)
 * - Validation immédiate & feedback clair
 * - Micro-interactions fluides (transitions, loading states)
 * - Confiance & transparence (champs obligatoires clairs)
 */
function PartnerSignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [formData, setFormData] = useState({
    // Agence
    agencyName: '',
    agencyPhone: '',
    agencyEmail: '',
    agencyAddress: '',
    agencyCity: '',
    agencyDescription: '',
    licenseNumber: '',
    registrationNumber: '',
    
    // Manager
    managerFirstName: '',
    managerLastName: '',
    managerEmail: '',
    managerPhone: '',
    managerPassword: '',
    managerPasswordConfirm: ''
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  // Validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'agencyName':
        if (!value.trim()) newErrors.agencyName = 'Le nom de l\'agence est requis';
        else if (value.length < 3) newErrors.agencyName = 'Minimum 3 caractères';
        else delete newErrors.agencyName;
        break;
      case 'agencyEmail':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.agencyEmail = 'Email invalide';
        else delete newErrors.agencyEmail;
        break;
      case 'agencyPhone':
        if (!value.match(/^[\d+\-\s()]+$/)) newErrors.agencyPhone = 'Téléphone invalide';
        else delete newErrors.agencyPhone;
        break;
      case 'agencyAddress':
        if (!value.trim()) newErrors.agencyAddress = 'Adresse requise';
        else delete newErrors.agencyAddress;
        break;
      case 'managerEmail':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.managerEmail = 'Email invalide';
        else delete newErrors.managerEmail;
        break;
      case 'managerPhone':
        if (!value.match(/^[\d+\-\s()]+$/)) newErrors.managerPhone = 'Téléphone invalide';
        else delete newErrors.managerPhone;
        break;
      case 'managerPassword':
        if (value.length < 6) newErrors.managerPassword = 'Minimum 6 caractères';
        else delete newErrors.managerPassword;
        break;
      case 'managerPasswordConfirm':
        if (value !== formData.managerPassword) newErrors.managerPasswordConfirm = 'Les mots de passe ne correspondent pas';
        else delete newErrors.managerPasswordConfirm;
        break;
      default:
        break;
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      setErrors(validateField(name, value));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(validateField(name, value));
  };

  const canProceedStep1 = () => {
    return formData.agencyName && 
           formData.agencyEmail && 
           formData.agencyPhone && 
           formData.agencyAddress &&
           !errors.agencyName &&
           !errors.agencyEmail &&
           !errors.agencyPhone &&
           !errors.agencyAddress;
  };

  const canProceedStep2 = () => {
    return formData.managerFirstName &&
           formData.managerLastName &&
           formData.managerEmail &&
           formData.managerPhone &&
           formData.managerPassword &&
           formData.managerPasswordConfirm &&
           !errors.managerEmail &&
           !errors.managerPhone &&
           !errors.managerPassword &&
           !errors.managerPasswordConfirm;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);

      const partnerResponse = await agencyService.partnerSignup({
        name: formData.agencyName,
        email: formData.agencyEmail,
        phone: formData.agencyPhone,
        address: formData.agencyAddress,
        city: formData.agencyCity,
        description: formData.agencyDescription,
        licenseNumber: formData.licenseNumber,
        registrationNumber: formData.registrationNumber,
        managerFirstName: formData.managerFirstName,
        managerLastName: formData.managerLastName,
        managerEmail: formData.managerEmail,
        managerPhone: formData.managerPhone,
        managerPassword: formData.managerPassword
      });

      if (!partnerResponse.success) {
        throw new Error(partnerResponse.message || 'Erreur lors de l\'inscription partenaire');
      }

      setSuccess('œ… Inscription réussie!');
      setCurrentStep(3);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur inscription partenaire:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* DECORATIVE BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* CONTAINER */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen flex items-center">
        <div className="w-full">
          
          {/* BACK BUTTON */}
          <Link 
            to="/" 
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour
          </Link>

          {/* HEADER */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
              Devenir Partenaire <span className="text-primary">AfriRide</span>
            </h1>
            <p className="text-lg text-slate-600">
              Rejoignez notre réseau de plus de 500 agences en Afrique
            </p>
          </div>

          {/* PROGRESS INDICATOR */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${
                      step < currentStep
                        ? 'bg-primary text-white shadow-lg'
                        : step === currentStep
                        ? 'bg-white text-primary border-2 border-primary shadow-lg'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                        step < currentStep ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Agence</span>
              <span>Manager</span>
              <span>Confirmation</span>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 animate-in slide-in-from-top">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3 animate-in slide-in-from-top">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">{success}</p>
                <p className="text-sm text-green-800">Redirection en cours...</p>
              </div>
            </div>
          )}

          {/* FORM WRAPPER */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <form onSubmit={handleSubmit}>

              {/* STEP 1 & 2 & 3 - Content continues... - LIMITED FOR SPACE */}
              {currentStep === 1 && (
                <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-primary" />
                    <span>Informations de l'agence</span>
                  </h2>
                  <p className="text-slate-600 mb-8">Renseignez les détails de votre agence de location</p>

                  <div className="space-y-6">
                    {/* NOM AGENCE */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Nom de l'agence <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="agencyName"
                        value={formData.agencyName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Ex: Prestige Rental"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                          errors.agencyName && touched.agencyName
                            ? 'border-red-500 bg-red-50 focus:ring-red-200'
                            : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        } focus:outline-none`}
                      />
                      {errors.agencyName && touched.agencyName && (
                        <p className="text-xs text-red-600 mt-2">{errors.agencyName}</p>
                      )}
                    </div>

                    {/* EMAIL & PHONE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            name="agencyEmail"
                            value={formData.agencyEmail}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="agence@email.com"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                              errors.agencyEmail && touched.agencyEmail
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 focus:border-primary'
                            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                          />
                        </div>
                        {errors.agencyEmail && touched.agencyEmail && (
                          <p className="text-xs text-red-600 mt-2">{errors.agencyEmail}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            name="agencyPhone"
                            value={formData.agencyPhone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="+221 77 123 45 67"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                              errors.agencyPhone && touched.agencyPhone
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 focus:border-primary'
                            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                          />
                        </div>
                        {errors.agencyPhone && touched.agencyPhone && (
                          <p className="text-xs text-red-600 mt-2">{errors.agencyPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* ADDRESS & CITY */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Adresse <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            name="agencyAddress"
                            value={formData.agencyAddress}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="123 Rue Principale"
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                              errors.agencyAddress && touched.agencyAddress
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 focus:border-primary'
                            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                          />
                        </div>
                        {errors.agencyAddress && touched.agencyAddress && (
                          <p className="text-xs text-red-600 mt-2">{errors.agencyAddress}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Ville
                        </label>
                        <input
                          type="text"
                          name="agencyCity"
                          value={formData.agencyCity}
                          onChange={handleChange}
                          placeholder="Dakar"
                          className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Description de l'agence
                      </label>
                      <textarea
                        name="agencyDescription"
                        value={formData.agencyDescription}
                        onChange={handleChange}
                        placeholder="Décrivez votre agence, votre flotte, vos services..."
                        rows="4"
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* STEP 1 BUTTONS */}
                  <div className="mt-10 flex gap-4">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-6 py-3 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedStep1()}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                        canProceedStep1()
                          ? 'bg-primary text-white hover:shadow-lg hover:-translate-y-0.5'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Continuer</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: MANAGER */}
              {currentStep === 2 && (
                <div className="p-8 sm:p-12 animate-in fade-in slide-in-from-right">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center space-x-3">
                    <User className="w-6 h-6 text-primary" />
                    <span>Votre compte Manager</span>
                  </h2>
                  <p className="text-slate-600 mb-8">Créez le compte de gestion de votre agence</p>

                  <div className="space-y-6">
                    {/* FIRST & LAST NAME */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="managerFirstName"
                          value={formData.managerFirstName}
                          onChange={handleChange}
                          placeholder="Jean"
                          className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="managerLastName"
                          value={formData.managerLastName}
                          onChange={handleChange}
                          placeholder="Dupont"
                          className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Email professionnel <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="managerEmail"
                          value={formData.managerEmail}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="manager@agence.com"
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                            errors.managerEmail && touched.managerEmail
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 focus:border-primary'
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        />
                      </div>
                      {errors.managerEmail && touched.managerEmail && (
                        <p className="text-xs text-red-600 mt-2">{errors.managerEmail}</p>
                      )}
                    </div>

                    {/* PHONE */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Téléphone manager <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          name="managerPhone"
                          value={formData.managerPhone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="+221 77 123 45 67"
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                            errors.managerPhone && touched.managerPhone
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 focus:border-primary'
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        />
                      </div>
                      {errors.managerPhone && touched.managerPhone && (
                        <p className="text-xs text-red-600 mt-2">{errors.managerPhone}</p>
                      )}
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Mot de passe <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="managerPassword"
                          value={formData.managerPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Minimum 6 caractères"
                          className={`w-full pl-4 pr-10 py-3 rounded-lg border-2 transition-all duration-200 ${
                            errors.managerPassword && touched.managerPassword
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 focus:border-primary'
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.managerPassword && touched.managerPassword && (
                        <p className="text-xs text-red-600 mt-2">{errors.managerPassword}</p>
                      )}
                    </div>

                    {/* PASSWORD CONFIRM */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Confirmer le mot de passe <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordConfirm ? 'text' : 'password'}
                          name="managerPasswordConfirm"
                          value={formData.managerPasswordConfirm}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Confirmez votre mot de passe"
                          className={`w-full pl-4 pr-10 py-3 rounded-lg border-2 transition-all duration-200 ${
                            errors.managerPasswordConfirm && touched.managerPasswordConfirm
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 focus:border-primary'
                          } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.managerPasswordConfirm && touched.managerPasswordConfirm && (
                        <p className="text-xs text-red-600 mt-2">{errors.managerPasswordConfirm}</p>
                      )}
                    </div>
                  </div>

                  {/* STEP 2 BUTTONS */}
                  <div className="mt-10 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={!canProceedStep2() || loading}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                        canProceedStep2() && !loading
                          ? 'bg-primary text-white hover:shadow-lg hover:-translate-y-0.5'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Création en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Créer mon compte</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRMATION */}
              {currentStep === 3 && (
                <div className="p-8 sm:p-12 text-center animate-in fade-in slide-in-from-right">
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Bienvenue sur AfriRide!
                  </h2>
                  <p className="text-lg text-slate-600 mb-8">
                    Votre agence a été inscrite avec succès. Vérification en cours...
                  </p>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Aller à la connexion
                  </button>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerSignupPage;

