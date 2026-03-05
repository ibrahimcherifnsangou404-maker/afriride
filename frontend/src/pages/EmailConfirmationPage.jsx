import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function EmailConfirmationPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setToken } = useAuth();

    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const confirmEmail = async () => {
            try {
                const response = await api.get(`/auth/confirm-email/${token}`);

                if (response.data.success) {
                    setStatus('success');
                    setMessage(response.data.message);

                    // Sauvegarder le token et connecter l'utilisateur (si le backend renvoie un token)
                    if (response.data.data && response.data.data.token) {
                        setToken(response.data.data.token, response.data.data.user);
                        // Rediriger vers l'accueil après 3 secondes
                        setTimeout(() => navigate('/'), 3000);
                    } else {
                        setTimeout(() => navigate('/login'), 3000);
                    }
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Lien de confirmation invalide ou expiré.');
            }
        };

        if (token) {
            confirmEmail();
        }
    }, [token, navigate, setToken]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-16 h-16 text-primary-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Vérification en cours...</h2>
                        <p className="text-slate-600">Veuillez patienter pendant que nous confirmons votre email.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Confirmé!</h2>
                        <p className="text-slate-600 mb-8">{message}</p>
                        <p className="text-sm text-slate-500 mb-6">Vous allez être redirigé automatiquement...</p>

                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
                        >
                            Aller à l'accueil
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Échec de la vérification</h2>
                        <p className="text-slate-600 mb-8">{message}</p>

                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                )}
            </div>

            <div className="mt-8 text-slate-500 text-sm">
                © 2026 AfriRide. Tous droits réservés.
            </div>
        </div>
    );
}

export default EmailConfirmationPage;

