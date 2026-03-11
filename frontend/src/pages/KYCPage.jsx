import { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Clock, FileText, Camera, X } from 'lucide-react';
import { userService } from '../services/userService';
import { Button, Card, Badge, PageSkeleton, Loading } from '../components/UI';
import { useNavigate } from 'react-router-dom';

function KYCPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState(null);
    const [files, setFiles] = useState({
        idCardFront: null,
        idCardBack: null,
        drivingLicense: null
    });
    const [previews, setPreviews] = useState({
        idCardFront: null,
        idCardBack: null,
        drivingLicense: null
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await userService.getProfile();
            setProfile(response.data);
        } catch (err) {
            console.error('Erreur chargement profil:', err);
            setError('Impossible de charger votre profil');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                setError('Type de fichier non autorise. Images (JPG, PNG, WEBP, HEIC) ou PDF uniquement.');
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                setError('Fichier trop volumineux (max 10MB par document).');
                return;
            }

            setError('');
            setFiles(prev => ({ ...prev, [field]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const isPdf = (field) => files[field]?.type === 'application/pdf';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.idCardFront || !files.idCardBack || !files.drivingLicense) {
            setError('Veuillez fournir tous les documents requis.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const formData = new FormData();
            formData.append('idCardFront', files.idCardFront);
            formData.append('idCardBack', files.idCardBack);
            formData.append('drivingLicense', files.drivingLicense);

            const response = await userService.submitKYC(formData);
            if (response.success) {
                setSuccess('Documents soumis avec succès !');
                setTimeout(() => {
                    loadProfile();
                }, 2000);
            }
        } catch (err) {
            console.error('Erreur soumission KYC:', err);
            setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Erreur lors de la soumission');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <PageSkeleton variant="form" />;

    const statusMap = {
        unverified: { color: 'bg-gray-100 text-gray-800', label: 'Non vérifié', icon: AlertCircle },
        pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Vérification en cours', icon: Clock },
        verified: { color: 'bg-green-100 text-green-800', label: 'Identité vérifiée', icon: CheckCircle },
        rejected: { color: 'bg-red-100 text-red-800', label: 'Dossier rejeté', icon: X }
    };

    const status = statusMap[profile?.verificationStatus] || statusMap.unverified;

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Vérification d'identité (KYC)</h1>
                    <p className="text-slate-600">Pour louer un véhicule sur AfriRide, nous devons vérifier votre identité et votre permis de conduire.</p>
                </header>

                {/* État actuel */}
                <Card className="mb-8 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${status.color}`}>
                                <status.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Statut de votre compte</p>
                                <h2 className="text-xl font-bold text-slate-900">{status.label}</h2>
                            </div>
                        </div>
                        {profile?.verificationStatus === 'verified' && (
                            <Badge variant="success" size="lg">Compte Certifié</Badge>
                        )}
                    </div>
                    {profile?.rejectionReason && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-bold">Motif du rejet :</p>
                                <p>{profile.rejectionReason}</p>
                            </div>
                        </div>
                    )}
                </Card>

                {profile?.verificationStatus === 'verified' ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Félicitations !</h3>
                        <p className="text-slate-600 mb-8">Votre identité a été vérifiée avec succès. Vous pouvez désormais profiter de tous nos services.</p>
                        <Button onClick={() => navigate('/vehicles')}>Voir les véhicules</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Carte d'identité Recto */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Carte d'Identité (Recto)</label>
                                <div className="relative group">
                                    <div className={`aspect-[1.6/1] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
                    ${previews.idCardFront ? 'border-primary-500 bg-white' : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-slate-100'}
                  `}>
                                        {previews.idCardFront ? (
                                            isPdf('idCardFront') ? (
                                                <div className="text-center p-6">
                                                    <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-600">{files.idCardFront?.name || 'Document PDF'}</p>
                                                </div>
                                            ) : (
                                            <img src={previews.idCardFront} alt="ID Recto" className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="text-center p-6">
                                                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">Cliquez pour uploader le recto</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileChange(e, 'idCardFront')}
                                            accept="image/*,application/pdf"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Carte d'identité Verso */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Carte d'Identité (Verso)</label>
                                <div className="relative group">
                                    <div className={`aspect-[1.6/1] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
                    ${previews.idCardBack ? 'border-primary-500 bg-white' : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-slate-100'}
                  `}>
                                        {previews.idCardBack ? (
                                            isPdf('idCardBack') ? (
                                                <div className="text-center p-6">
                                                    <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-600">{files.idCardBack?.name || 'Document PDF'}</p>
                                                </div>
                                            ) : (
                                            <img src={previews.idCardBack} alt="ID Verso" className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="text-center p-6">
                                                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">Cliquez pour uploader le verso</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileChange(e, 'idCardBack')}
                                            accept="image/*,application/pdf"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Permis de conduire */}
                            <div className="md:col-span-2 space-y-4">
                                <label className="block text-sm font-bold text-slate-700">Permis de Conduire</label>
                                <div className="relative group">
                                    <div className={`aspect-[3/1] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all
                    ${previews.drivingLicense ? 'border-primary-500 bg-white' : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-slate-100'}
                  `}>
                                        {previews.drivingLicense ? (
                                            isPdf('drivingLicense') ? (
                                                <div className="text-center p-6">
                                                    <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-600">{files.drivingLicense?.name || 'Document PDF'}</p>
                                                </div>
                                            ) : (
                                            <img src={previews.drivingLicense} alt="Permis" className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="text-center p-6">
                                                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">Uploader votre permis de conduire (recto-verso ou PDF)</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileChange(e, 'drivingLicense')}
                                            accept="image/*,application/pdf"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5" />
                                <span>{success}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-4 text-lg font-bold shadow-xl"
                            disabled={submitting || profile?.verificationStatus === 'pending'}
                        >
                            {submitting ? (
                                <>
                                    <Loading size="sm" className="mr-2" />
                                    Envoi des documents...
                                </>
                            ) : profile?.verificationStatus === 'pending' ? (
                                'Documents en cours d\'examen'
                            ) : (
                                'Envoyer pour vérification'
                            )}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default KYCPage;

