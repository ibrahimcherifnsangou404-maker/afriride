import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Scale, Wallet } from 'lucide-react';
import { managerService } from '../../services/managerService';

function ManagerContractPolicy() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [formData, setFormData] = useState({
    contractCountry: '',
    contractJurisdictionCity: '',
    defaultDepositAmount: '',
    defaultDailyKmLimit: '',
    defaultLateFeePerHour: ''
  });

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const response = await managerService.getAgencyContractPolicy();
      setAgencyName(response.data.name || '');
      setFormData({
        contractCountry: response.data.contractCountry || '',
        contractJurisdictionCity: response.data.contractJurisdictionCity || '',
        defaultDepositAmount: response.data.defaultDepositAmount || '',
        defaultDailyKmLimit: response.data.defaultDailyKmLimit || '',
        defaultLateFeePerHour: response.data.defaultLateFeePerHour || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger la politique contractuelle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const response = await managerService.updateAgencyContractPolicy(formData);
      setSuccess(response.message || 'Politique contractuelle mise a jour');
      setAgencyName(response.data.name || agencyName);
      setFormData({
        contractCountry: response.data.contractCountry || '',
        contractJurisdictionCity: response.data.contractJurisdictionCity || '',
        defaultDepositAmount: response.data.defaultDepositAmount || '',
        defaultDailyKmLimit: response.data.defaultDailyKmLimit || '',
        defaultLateFeePerHour: response.data.defaultLateFeePerHour || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-600">Chargement de la politique contractuelle...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Politique contrat agence</h1>
          <p className="text-slate-600 mt-2">
            Configure les regles qui seront injectees automatiquement dans les prochains contrats de {agencyName || 'ton agence'}.
          </p>
        </div>

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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Regles par defaut</h2>
              <p className="text-sm text-slate-500 mt-1">
                Ces valeurs servent de base contractuelle pour les nouvelles reservations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Pays applicable</span>
                <input
                  name="contractCountry"
                  value={formData.contractCountry}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex: Cameroun"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Ville de juridiction</span>
                <input
                  name="contractJurisdictionCity"
                  value={formData.contractJurisdictionCity}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex: Douala"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Depot de garantie</span>
                <input
                  name="defaultDepositAmount"
                  value={formData.defaultDepositAmount}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex: 100000 FCFA"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Kilometrage journalier</span>
                <input
                  name="defaultDailyKmLimit"
                  value={formData.defaultDailyKmLimit}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex: 250"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Penalite de retard par heure</span>
                <input
                  name="defaultLateFeePerHour"
                  value={formData.defaultLateFeePerHour}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex: 10000 FCFA / heure"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la politique contrat'}
            </button>
          </form>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900">Apercu des clauses</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Scale className="w-4 h-4" />
                    Juridiction
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Droit applicable en <span className="font-semibold text-slate-900">{formData.contractCountry || '-'}</span>, ville de competence <span className="font-semibold text-slate-900">{formData.contractJurisdictionCity || '-'}</span>.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Wallet className="w-4 h-4" />
                    Caution et retard
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Depot indicatif: <span className="font-semibold text-slate-900">{formData.defaultDepositAmount || '-'}</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Penalite indicative: <span className="font-semibold text-slate-900">{formData.defaultLateFeePerHour || '-'}</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <FileText className="w-4 h-4" />
                    Exploitation
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Kilometrage inclus: <span className="font-semibold text-slate-900">{formData.defaultDailyKmLimit || '-'}</span> km / jour.
                  </p>
                  <p className="text-sm text-slate-500 mt-3">
                    Ces valeurs s’appliqueront aux nouveaux contrats generes apres enregistrement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerContractPolicy;
