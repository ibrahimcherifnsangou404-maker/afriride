import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    User, Mail, Phone, Camera, Save, MapPin,
    Calendar, Shield, Award, Edit2, CheckCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/api';
import { Footer } from '../components/Layout/Footer';
import { Card, Button, Input, Badge, Loading } from '../components/UI';

function ProfilePage() {
    const { user } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                country: user.country || 'Cameroun'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');

        try {
            const response = await authService.updateProfile(formData);
            if (response.success) {
                // Mettre à jour le contexte via une pseudo-connexion ou une méthode update locale si elle existait
                // Ici on suppose que login met à jour le storage et le state
                const updatedUser = { ...user, ...formData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Idéalement authContext devrait avoir une méthode updateUser, on force le reload pour l'instant ou on attend une meilleure implémentation
                window.location.reload();

                setSuccessMsg('Profil mis à jour avec succès !');
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Erreur mise à jour:', error);
            alert('Erreur lors de la mise à jour du profil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Header Profile */}
            <div className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 py-12 max-w-5xl">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-4xl font-bold text-primary-600 border-4 border-white shadow-xl">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full hover:bg-black transition-colors shadow-lg">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</h1>
                                <Badge variant="success" className="mb-0">Client Vérifié</Badge>
                            </div>
                            <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 mb-4">
                                <Mail className="w-4 h-4" /> {user?.email}
                            </p>

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Membre depuis</p>
                                        <p className="text-sm font-bold text-slate-900">{new Date(user?.createdAt || Date.now()).getFullYear()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                    <Award className="w-4 h-4 text-amber-500" />
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Statut</p>
                                        <p className="text-sm font-bold text-slate-900">Silver</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Modifier mon profil
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-primary-600" />
                                Sécurité du compte
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Email validé</span>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Téléphone vérifié</span>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <Button variant="outline" size="sm" className="w-full">Changer mot de passe</Button>
                                </div>
                                <div>
                                    <Link to="/kyc" className="block">
                                        <Button variant="outline" size="sm" className="w-full">Verifier mon identite (KYC)</Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <Card className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-900">Informations Personnelles</h2>
                                {successMsg && <span className="text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">{successMsg}</span>}
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Prénom</label>
                                        <Input
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            icon={User}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nom</label>
                                        <Input
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            icon={User}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                        <Input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={true}
                                            className="bg-slate-50 text-slate-500"
                                            icon={Mail}
                                        />
                                        <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Téléphone</label>
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            icon={Phone}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 mb-8">
                                    <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Adresse</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Adresse complète</label>
                                            <Input
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                icon={MapPin}
                                                placeholder="Entrez votre adresse"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Ville</label>
                                            <Input
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Pays</label>
                                            <Input
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Annuler</Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? <Loading size="sm" /> : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </Card>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}

export default ProfilePage;


