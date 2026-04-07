import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, FileText, ShieldCheck, Upload } from 'lucide-react';
import { managerService } from '../../services/managerService';
import { ProtectedDocumentButton } from '../../components/ProtectedDocument';

const statusMeta = {
  unverified: {
    label: 'Non soumis',
    className: 'bg-slate-100 text-slate-700',
    icon: FileText
  },
  pending: {
    label: 'En verification',
    className: 'bg-amber-100 text-amber-800',
    icon: Clock3
  },
  verified: {
    label: 'Verifiee',
    className: 'bg-emerald-100 text-emerald-800',
    icon: ShieldCheck
  },
  rejected: {
    label: 'Rejetee',
    className: 'bg-red-100 text-red-800',
    icon: AlertCircle
  }
};

function ManagerAgencyKYC() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agency, setAgency] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    city: '',
    licenseNumber: '',
    registrationNumber: ''
  });
  const [files, setFiles] = useState({
    businessLicense: null,
    taxCertificate: null,
    insuranceCertificate: null
  });

  const loadAgency = async () => {
    try {
      setLoading(true);
      const response = await managerService.getAgencyKycStatus();
      setAgency(response.data);
      setFormData({
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        licenseNumber: response.data.licenseNumber || '',
        registrationNumber: response.data.registrationNumber || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le dossier KYC agence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgency();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles((prev) => ({ ...prev, [name]: selectedFiles?.[0] || null }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      Object.entries(files).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });

      const response = await managerService.submitAgencyKyc(payload);
      setSuccess(response.message || 'Dossier KYC soumis avec succes');
      await loadAgency();
      setFiles({
        businessLicense: null,
        taxCertificate: null,
        insuranceCertificate: null
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission du dossier KYC');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-600">Chargement du dossier KYC agence...</div>;
  }

  const meta = statusMeta[agency?.verificationStatus || 'unverified'];
  const StatusIcon = meta.icon;
  const docs = agency?.kycDocuments || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">KYC agence</h1>
            <p className="text-slate-600 mt-2">
              Tant que l'agence n'est pas verifiee, les vehicules restent en brouillon et ne sont pas publies.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${meta.className}`}>
            <StatusIcon className="w-4 h-4" />
            {meta.label}
          </div>
        </div>

        {agency?.verificationStatus === 'rejected' && agency?.rejectionReason && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
            <p className="font-semibold">Motif de rejet</p>
            <p className="mt-1 text-sm">{agency.rejectionReason}</p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Informations legales</h2>
              <p className="text-sm text-slate-500 mt-1">Mettez a jour les informations et envoyez les documents justificatifs.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email agence</span>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Telephone</span>
                <input name="phone" value={formData.phone} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Adresse</span>
                <input name="address" value={formData.address} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Ville</span>
                <input name="city" value={formData.city} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Numero licence</span>
                <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Numero immatriculation entreprise</span>
                <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                ['businessLicense', 'Licence commerciale'],
                ['taxCertificate', 'Certificat fiscal'],
                ['insuranceCertificate', 'Assurance professionnelle']
              ].map(([field, label]) => (
                <label key={field} className="block rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Upload className="w-4 h-4" />
                    <span>{files[field] ? files[field].name : 'PDF ou image'}</span>
                  </div>
                  <input name={field} type="file" accept=".pdf,image/*" onChange={handleFileChange} className="mt-3 block w-full text-sm" />
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Envoi du dossier...' : 'Soumettre le dossier KYC'}
            </button>
          </form>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Documents actuels</h2>
              <p className="text-sm text-slate-500 mt-1">Les documents deja envoyes restent visibles ici.</p>
            </div>

            {[
              ['Licence commerciale', docs.businessLicense],
              ['Certificat fiscal', docs.taxCertificate],
              ['Assurance professionnelle', docs.insuranceCertificate]
            ].map(([label, file]) => (
              <div key={label} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                {file ? (
                  <ProtectedDocumentButton
                    path={file}
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700"
                  >
                    Voir le document
                  </ProtectedDocumentButton>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Aucun document envoye</p>
                )}
              </div>
            ))}

            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Rappel</p>
              <p className="mt-2">Tant que le dossier reste en attente ou rejete, les vehicules de l'agence ne peuvent pas etre publies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerAgencyKYC;
