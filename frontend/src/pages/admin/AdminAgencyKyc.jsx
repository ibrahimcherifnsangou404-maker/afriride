import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { API_BASE_URL } from '../../services/api';

const tabs = ['pending', 'verified', 'rejected', 'unverified'];

const statusMeta = {
  unverified: { label: 'Non soumis', className: 'bg-slate-100 text-slate-700', icon: AlertCircle },
  pending: { label: 'En verification', className: 'bg-amber-100 text-amber-800', icon: Clock3 },
  verified: { label: 'Verifiee', className: 'bg-emerald-100 text-emerald-800', icon: ShieldCheck },
  rejected: { label: 'Rejetee', className: 'bg-red-100 text-red-800', icon: XCircle }
};

function AdminAgencyKyc() {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [agencies, setAgencies] = useState([]);

  const loadRequests = async (nextStatus = status) => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAgencyKycRequests(nextStatus);
      setAgencies(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les dossiers KYC agence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(status);
  }, [status]);

  const handleApprove = async (agencyId) => {
    try {
      setSavingId(agencyId);
      await adminService.approveAgencyKyc(agencyId);
      await loadRequests(status);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setSavingId('');
    }
  };

  const handleReject = async (agencyId) => {
    const reason = window.prompt('Motif du rejet KYC agence :');
    if (!reason) return;

    try {
      setSavingId(agencyId);
      await adminService.rejectAgencyKyc(agencyId, reason);
      await loadRequests(status);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">KYC agences</h1>
          <p className="text-slate-600 mt-2">
            Verifiez les documents des agences avant d'autoriser la publication de leurs vehicules.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                status === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {statusMeta[tab].label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-600">Chargement des dossiers...</div>
        ) : agencies.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-8 text-slate-500">
            Aucun dossier pour ce filtre.
          </div>
        ) : (
          <div className="grid gap-5">
            {agencies.map((agency) => {
              const meta = statusMeta[agency.verificationStatus || 'unverified'];
              const StatusIcon = meta.icon;
              const managers = agency.managers || [];
              const docs = agency.kycDocuments || {};

              return (
                <div key={agency.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">{agency.name}</h2>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-800">Email:</span> {agency.email}</p>
                        <p><span className="font-semibold text-slate-800">Telephone:</span> {agency.phone}</p>
                        <p><span className="font-semibold text-slate-800">Ville:</span> {agency.city || '-'}</p>
                        <p><span className="font-semibold text-slate-800">Adresse:</span> {agency.address || '-'}</p>
                        <p><span className="font-semibold text-slate-800">Licence:</span> {agency.licenseNumber || '-'}</p>
                        <p><span className="font-semibold text-slate-800">Registre:</span> {agency.registrationNumber || '-'}</p>
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Managers:</span>{' '}
                        {managers.length
                          ? managers.map((manager) => `${manager.firstName} ${manager.lastName} (${manager.email})`).join(', ')
                          : 'Aucun manager'}
                      </div>
                      {agency.rejectionReason && (
                        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                          <span className="font-semibold">Motif de rejet:</span> {agency.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="lg:w-[360px] space-y-3">
                      {[
                        ['Licence commerciale', docs.businessLicense],
                        ['Certificat fiscal', docs.taxCertificate],
                        ['Assurance professionnelle', docs.insuranceCertificate]
                      ].map(([label, file]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          {file ? (
                            <a
                              href={`${API_BASE_URL}${file}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              Ouvrir
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">Document manquant</p>
                          )}
                        </div>
                      ))}

                      {agency.verificationStatus === 'pending' && (
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(agency.id)}
                            disabled={savingId === agency.id}
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(agency.id)}
                            disabled={savingId === agency.id}
                            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAgencyKyc;
