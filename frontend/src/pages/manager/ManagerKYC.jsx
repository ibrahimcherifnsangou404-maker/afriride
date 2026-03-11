import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, AlertCircle, Clock, User, Download, ExternalLink } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, Button, Badge, PageSkeleton } from '../../components/UI';
import { Modal } from '../../components/Modal';
import { API_BASE_URL } from '../../services/api';

function ManagerKYC() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadPendingKYC();
    }, []);

    const loadPendingKYC = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPendingKYC();
            setUsers(response.data);
        } catch (err) {
            console.error('Erreur chargement KYC:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        if (!window.confirm('Voulez-vous approuver ce dossier ?')) return;
        try {
            setActionLoading(true);
            await adminService.approveKYC(userId);
            setIsModalOpen(false);
            loadPendingKYC();
        } catch (err) {
            console.error('Erreur approbation:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        try {
            setActionLoading(true);
            await adminService.rejectKYC(selectedUser.id, rejectReason);
            setIsRejectModalOpen(false);
            setIsModalOpen(false);
            setRejectReason('');
            loadPendingKYC();
        } catch (err) {
            console.error('Erreur rejet:', err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <PageSkeleton variant="table" />;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Vérifications d'Identité</h1>
                <p className="text-slate-500">Gérez les demandes de validation de profil des clients.</p>
            </header>

            {users.length === 0 ? (
                <Card className="p-12 text-center text-slate-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Aucune vérification en attente</p>
                    <p className="text-sm">Tous les dossiers ont été traités.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {users.map((user) => (
                        <Card key={user.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{user.firstName} {user.lastName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock className="w-4 h-4" />
                                        Soumis le {new Date(user.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="warning">En attente</Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Examiner
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal d'examen */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Examen du Dossier KYC"
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                            <User className="w-10 h-10 text-slate-400" />
                            <div>
                                <p className="font-bold text-lg">{selectedUser.firstName} {selectedUser.lastName}</p>
                                <p className="text-sm text-slate-500">{selectedUser.email} | {selectedUser.phone}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'CNI Recto', field: 'idCardFront' },
                                { label: 'CNI Verso', field: 'idCardBack' },
                                { label: 'Permis de Conduire', field: 'drivingLicense' }
                            ].map((doc) => (
                                <div key={doc.field} className="space-y-2">
                                    <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                                    <div className="relative group aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                                        {selectedUser[doc.field] ? (
                                            selectedUser[doc.field].endsWith('.pdf') ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                                                    <FileText className="w-12 h-12 text-red-500 mb-2" />
                                                    <p className="text-xs font-medium text-slate-600">Document PDF</p>
                                                </div>
                                            ) : (
                                                <img
                                                    src={`${API_BASE_URL}${selectedUser[doc.field]}`}
                                                    alt={doc.label}
                                                    className="w-full h-full object-cover"
                                                />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                <p className="text-xs text-slate-400 italic">Non fourni</p>
                                            </div>
                                        )}

                                        {selectedUser[doc.field] && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <a
                                                    href={`${API_BASE_URL}${selectedUser[doc.field]}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-100">
                            <Button
                                variant="success"
                                className="flex-1"
                                onClick={() => handleApprove(selectedUser.id)}
                                disabled={actionLoading}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approuver le profil
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1"
                                onClick={() => setIsRejectModalOpen(true)}
                                disabled={actionLoading}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rejeter le dossier
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de rejet */}
            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Motif du Rejet"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Veuillez expliquer au client pourquoi son dossier a été rejeté.</p>
                    <textarea
                        className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 bg-slate-50 min-h-[100px]"
                        placeholder="Ex: Photo floue, document expiré..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>Annuler</Button>
                        <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}>
                            Confirmer le rejet
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ManagerKYC;

