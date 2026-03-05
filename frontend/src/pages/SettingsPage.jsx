import { useState } from 'react';
import {
    Lock, Bell, Shield,
    Smartphone, Mail, Trash2
} from 'lucide-react';
import { Footer } from '../components/Layout/Footer';
import { Card, Button, Input } from '../components/UI';

function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email_booking: true,
        email_promo: false,
        sms_booking: true,
        sms_promo: false
    });

    const toggleNotif = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            <div className="bg-white border-b border-slate-200 py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Paramètres du compte</h1>
                    <p className="text-slate-500">Gérez vos préférences, votre sécurité et vos notifications.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">

                {/* Sécurité */}
                <Card className="p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Lock className="w-6 h-6 mr-3 text-primary-600" />
                        Sécurité & Mot de passe
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mot de passe actuel</label>
                                <Input type="password" placeholder="********" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nouveau mot de passe</label>
                                <Input type="password" placeholder="********" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Confirmer le nouveau mot de passe</label>
                                <Input type="password" placeholder="********" />
                            </div>
                            <Button className="mt-2">Mettre à jour le mot de passe</Button>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
                            <h3 className="font-bold text-slate-900 mb-2">Conseils de sécurité</h3>
                            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                                <li>Utilisez au moins 8 caractères</li>
                                <li>Incluez des majuscules et des chiffres</li>
                                <li>Ne partagez jamais votre mot de passe</li>
                                <li>Changez-le régulièrement</li>
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Notifications */}
                <Card className="p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Bell className="w-6 h-6 mr-3 text-amber-500" />
                        Préférences de notifications
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Notifications Email</p>
                                    <p className="text-sm text-slate-500">Recevez des emails pour vos réservations</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notifications.email_booking}
                                    onChange={() => toggleNotif('email_booking')}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Notifications SMS</p>
                                    <p className="text-sm text-slate-500">Soyez alerté par SMS en temps réel</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notifications.sms_booking}
                                    onChange={() => toggleNotif('sms_booking')}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* Zone Danger */}
                <div className="border border-red-100 rounded-2xl bg-red-50 p-8">
                    <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                        <Shield className="w-6 h-6 mr-3" />
                        Zone de danger
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-red-900">Supprimer mon compte</p>
                            <p className="text-sm text-red-700">Cette action est irréversible. Toutes vos données seront effacées.</p>
                        </div>
                        <Button variant="error" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                        </Button>
                    </div>
                </div>

            </div>

            <Footer />
        </div>
    );
}

export default SettingsPage;



