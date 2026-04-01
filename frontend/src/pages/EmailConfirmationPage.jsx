import { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function EmailConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmailCode, resendEmailCode } = useAuth();

  const initialEmail = useMemo(
    () => String(location.state?.email || '').trim().toLowerCase(),
    [location.state?.email]
  );
  const autoSent = Boolean(location.state?.autoSent);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    autoSent ? 'Un code de vérification vient d\'être envoyé à votre adresse email.' : ''
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !code) {
      setError('Veuillez entrer votre email et le code reçu.');
      return;
    }

    setLoading(true);
    const result = await verifyEmailCode({
      email: email.trim().toLowerCase(),
      code: code.trim()
    });
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccess(result.message || 'Email vérifié avec succès.');
    setTimeout(() => navigate('/'), 1800);
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Veuillez entrer votre email pour recevoir un nouveau code.');
      return;
    }

    setResending(true);
    const result = await resendEmailCode(email.trim().toLowerCase());
    setResending(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccess(result.message || 'Un nouveau code a été envoyé.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Vérification de l'email</h1>
          <p className="text-slate-600 mt-2">
            Entrez le code à 6 chiffres reçu par email pour activer votre compte.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 flex gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-slate-800 mb-2">
              Code de vérification
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {loading ? 'Vérification...' : 'Valider le code'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-70 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {resending ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {resending ? 'Envoi...' : 'Renvoyer un code'}
        </button>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmationPage;
