import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CreditCard, Smartphone, Shield, Lock, CheckCircle,
    AlertCircle, Loader, ChevronRight, Wallet
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { Button, Card } from '../components/UI';

function PaymentPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [paymentId, setPaymentId] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [requiresKyc, setRequiresKyc] = useState(false);

    // Form State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const loadBooking = useCallback(async () => {
        try {
            const response = await bookingService.getBookingById(bookingId);
            setBooking(response.data);
        } catch {
            setError('Impossible de charger la réservation');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);
    useEffect(() => {
        loadBooking();
    }, [loadBooking]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        setRequiresKyc(false);

        if (!selectedMethod) {
            setError('Veuillez choisir un mode de paiement');
            return;
        }

        try {
            setProcessing(true);

            // 1. Initialiser le paiement
            const initResponse = await paymentService.initiatePayment({
                bookingId,
                amount: booking.totalPrice,
                paymentMethod: selectedMethod,
                phoneNumber: ['momo_mtn', 'momo_orange'].includes(selectedMethod) ? phoneNumber : null
            });

            if (initResponse.data.success) {
                setPaymentId(initResponse.data.data.id);
                // 2. Traiter le paiement (Simulation)
                const processResponse = await paymentService.processPayment({
                    paymentId: initResponse.data.data.id
                });

                if (processResponse.data.success) {
                    setSuccess(true);
                    // Redirection vers la signature du contrat
                    setTimeout(() => {
                        if (processResponse.data.contractId) {
                            navigate(`/contracts/${processResponse.data.contractId}`);
                        } else {
                            navigate('/my-bookings');
                        }
                    }, 3000);
                } else {
                    setError(processResponse.data.message || 'Paiement échoué');
                }
            }
        } catch (err) {
            console.error(err);
            setRequiresKyc(err.response?.data?.errorCode === 'KYC_REQUIRED');
            setError(err.response?.data?.message || 'Erreur lors du paiement');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
    );

    const handleDownloadReceipt = async () => {
        try {
            const response = await paymentService.downloadReceipt(paymentId);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `AfriRide_Receipt_${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError('Impossible de télécharger le reçu');
        }
    };

    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <Card className="max-w-md w-full p-8 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement Réussi !</h1>
                <p className="text-gray-600 mb-6">
                    Paiement validé ! Redirection vers le contrat pour signature...
                </p>
                <Button onClick={handleDownloadReceipt} className="w-full mb-4">
                    Télécharger le reçu (PDF)
                </Button>
                <Loader className="w-6 h-6 text-green-600 animate-spin mx-auto" />
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="container mx-auto max-w-5xl">
                <h1 className="text-3xl font-black text-gray-900 mb-8">Finaliser votre réservation</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Colonne Gauche: Méthodes de Paiement */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Choisir un moyen de paiement
                            </h2>

                            <div className="grid gap-4">
                                {[
                                    { id: 'momo_orange', name: 'Orange Money', icon: Smartphone, color: 'bg-orange-500' },
                                    { id: 'momo_mtn', name: 'MTN Mobile Money', icon: Smartphone, color: 'bg-yellow-400' },
                                    { id: 'card', name: 'Carte Bancaire', icon: CreditCard, color: 'bg-blue-600' },
                                ].map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                      ${selectedMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                                    >
                                        <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center text-white shadow-md`}>
                                            <method.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{method.name}</h3>
                                            <p className="text-xs text-gray-500">Paiement sécurisé et instantané</p>
                                        </div>
                                        {selectedMethod === method.id && (
                                            <div className="absolute top-4 right-4">
                                                <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-100" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Formulaire dynamique selon la méthode */}
                            {selectedMethod && (
                                <div className="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
                                    <form onSubmit={handlePayment}>

                                        {['momo_orange', 'momo_mtn'].includes(selectedMethod) && (
                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-gray-700">Numéro de téléphone</label>
                                                <div className="relative">
                                                    <Smartphone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                                    <input
                                                        type="tel"
                                                        placeholder="Ex: 690 90 90 90"
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {selectedMethod === 'card' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Numéro de carte</label>
                                                    <div className="relative">
                                                        <CreditCard className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                                        <input
                                                            type="text"
                                                            placeholder="0000 0000 0000 0000"
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={cardNumber}
                                                            onChange={(e) => setCardNumber(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">Expiration</label>
                                                        <input
                                                            type="text"
                                                            placeholder="MM/YY"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={expiryDate}
                                                            onChange={(e) => setExpiryDate(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">CVV</label>
                                                        <input
                                                            type="text"
                                                            placeholder="123"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={cvv}
                                                            onChange={(e) => setCvv(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {error && (
                                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                {error}
                                            </div>
                                        )}

                                        {requiresKyc && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full mt-3"
                                                onClick={() => navigate('/kyc')}
                                            >
                                                Completer mon KYC
                                            </Button>
                                        )}

                                        <Button
                                            disabled={processing}
                                            className="w-full mt-6 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                                        >
                                            {processing ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader className="w-5 h-5 animate-spin" /> Traitement...
                                                </span>
                                            ) : (
                                                `Payer ${parseInt(booking?.totalPrice).toLocaleString()} FCFA`
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Colonne Droite: Résumé */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Résumé de la commande</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Véhicule</span>
                                    <span className="font-semibold">{booking?.Vehicle?.brand} {booking?.Vehicle?.model}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Durée</span>
                                    <span className="font-semibold">{booking?.totalDays} jours</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Dates</span>
                                    <span className="font-semibold text-right">
                                        {new Date(booking?.startDate).toLocaleDateString()} - <br />
                                        {new Date(booking?.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-900 font-bold">Total à payer</span>
                                    <span className="text-2xl font-black text-blue-600">
                                        {parseInt(booking?.totalPrice).toLocaleString()} <span className="text-sm text-gray-500">FCFA</span>
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Votre paiement est sécurisé par chiffrement SSL. Nous ne stockons pas vos informations bancaires.
                                </p>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PaymentPage;




