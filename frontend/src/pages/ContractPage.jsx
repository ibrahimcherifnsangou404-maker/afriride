import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader,
  CalendarDays,
  Wallet,
  Building2,
  User,
  Car,
  Printer
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { AuthContext } from '../context/AuthContext';
import { PageSkeleton } from '../components/UI';

const formatDate = (value, withTime = false) => {
  if (!value) return '-';
  const date = new Date(value);
  return withTime ? date.toLocaleString('fr-FR') : date.toLocaleDateString('fr-FR');
};

const formatAmount = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

function ContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contractService.getContractById(id);
      setContract(response.data.data);
    } catch (err) {
      console.error('Erreur chargement contrat:', err);
      setError('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const handleSignAsClient = async () => {
    try {
      setSigning(true);
      setError('');
      const response = await contractService.signContractAsClient(id);
      setSuccess('Contrat signé avec succès. En attente de validation par lâ€™agence.');
      setContract(response.data.data);
      setTimeout(() => navigate('/my-bookings'), 1800);
    } catch (err) {
      console.error('Erreur signature client:', err);
      setError(err.response?.data?.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handleSignAsAgency = async () => {
    try {
      setSigning(true);
      setError('');
      const response = await contractService.signContractAsAgency(id);
      setSuccess('Contrat signé au nom de lâ€™agence.');
      setContract(response.data.data);
      setTimeout(() => loadContract(), 1000);
    } catch (err) {
      console.error('Erreur signature agence:', err);
      setError(err.response?.data?.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <PageSkeleton variant="detail" />;
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold">Contrat non trouvé</p>
          <Link to="/my-bookings" className="text-primary hover:underline mt-4 inline-block">
            Retour aux réservations
          </Link>
        </div>
      </div>
    );
  }

  const isClientSigned = !!contract.clientSignatureDate;
  const isAgencySigned = !!contract.agencySignatureDate;
  const isFullySigned = isClientSigned && isAgencySigned;
  const backLink = user?.role === 'manager' || user?.role === 'admin' ? '/manager/bookings' : '/my-bookings';

    let statusConfig = { label: 'Signature en attente', className: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (isFullySigned) {
    statusConfig = { label: 'Contrat entièrement signé', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  } else if (contract.status === 'cancelled' || contract.status === 'terminated') {
    statusConfig = { label: 'Contrat clos', className: 'bg-red-100 text-red-800 border-red-200' };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/40 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link to={backLink} className="text-sm font-bold text-primary hover:text-emerald-700">
            Retour aux réservations
          </Link>
          <div className={`text-xs font-bold border rounded-full px-3 py-1 ${statusConfig.className}`}>
            {statusConfig.label}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-emerald-200 text-xs uppercase tracking-[0.16em] font-bold mb-2">Document contractuel</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Contrat de location</h1>
              <p className="text-slate-300 mt-2">Référence {contract.contractNumber}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                <p className="text-[11px] uppercase text-slate-300 font-bold">Début</p>
                <p className="font-bold">{formatDate(contract.startDate)}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                <p className="text-[11px] uppercase text-slate-300 font-bold">Fin</p>
                <p className="font-bold">{formatDate(contract.endDate)}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                <p className="text-[11px] uppercase text-slate-300 font-bold">Montant</p>
                <p className="font-bold">{formatAmount(contract.totalAmount)}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                <p className="text-[11px] uppercase text-slate-300 font-bold">Type</p>
                <p className="font-bold capitalize">{contract.contractType}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-black text-slate-900 mb-5">Parties prenantes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-2">Locataire</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><User className="w-4 h-4" /> {contract.user?.firstName} {contract.user?.lastName}</p>
                  <p className="text-sm text-slate-600 mt-1">{contract.user?.email || '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-2">Agence</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><Building2 className="w-4 h-4" /> {contract.agency?.name || '-'}</p>
                  <p className="text-sm text-slate-600 mt-1">{contract.agency?.email || '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase font-bold text-slate-500 mb-2">Véhicule</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><Car className="w-4 h-4" /> {contract.booking?.vehicle?.brand} {contract.booking?.vehicle?.model}</p>
                  <p className="text-sm text-slate-600 mt-1">{contract.booking?.vehicle?.licensePlate || '-'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-slate-600" />
                Conditions générales
              </h2>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {contract.terms || 'Aucune condition générale renseignée.'}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-600" />
                Conditions de paiement
              </h2>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {contract.paymentTerms || 'Aucune condition de paiement renseignée.'}
              </div>
            </section>

            {contract.notes && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
                <h2 className="text-xl font-black text-slate-900 mb-4">Notes complémentaires</h2>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700 whitespace-pre-wrap">
                  {contract.notes}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-black text-slate-900 mb-4">Statut des signatures</h3>
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${isClientSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-slate-900">Client</p>
                    {isClientSigned ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-slate-400" />}
                  </div>
                  <p className="text-sm text-slate-600">{isClientSigned ? `Signé le ${formatDate(contract.clientSignatureDate, true)}` : 'Signature en attente'}</p>
                  {user?.role === 'client' && !isClientSigned && (
                    <button
                      onClick={handleSignAsClient}
                      disabled={signing}
                      className="mt-3 w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signing ? 'Signature en cours...' : 'Signer le contrat'}
                    </button>
                  )}
                </div>

                <div className={`rounded-xl border p-4 ${isAgencySigned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-slate-900">Agence</p>
                    {isAgencySigned ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-slate-400" />}
                  </div>
                  <p className="text-sm text-slate-600">{isAgencySigned ? `Signé le ${formatDate(contract.agencySignatureDate, true)}` : 'Signature en attente'}</p>
                  {(user?.role === 'manager' || user?.role === 'admin') && !isAgencySigned && (
                    <button
                      onClick={handleSignAsAgency}
                      disabled={signing}
                      className="mt-3 w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signing ? 'Signature en cours...' : 'Signer au nom de lâ€™agence'}
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-black text-slate-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {contract.documentUrl && (
                  <a
                    href={contract.documentUrl}
                    download
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le PDF
                  </a>
                )}
                <button
                  onClick={handlePrint}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <Link
                  to={backLink}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Retour
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ContractPage;





