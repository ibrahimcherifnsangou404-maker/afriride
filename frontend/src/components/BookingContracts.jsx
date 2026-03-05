import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { contractService } from '../services/contractService';

function BookingContracts({ bookingId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contractService.getContractsByBooking(bookingId);
      setContracts(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement contrats:', err);
      setError('Erreur lors du chargement des contrats');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  if (loading) {
    return <div className="text-center text-slate-600">Chargement des contrats...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (contracts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const isClientSigned = !!contract.clientSignatureDate;
        const isAgencySigned = !!contract.agencySignatureDate;
        const isFullySigned = isClientSigned && isAgencySigned;

        return (
          <div
            key={contract.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-2.5">
                  <FileText className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Contrat {contract.contractNumber}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Type <span className="font-semibold capitalize">{contract.contractType}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Montant <span className="font-bold text-slate-900">{Number(contract.totalAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  {isClientSigned ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-400 mx-auto" />}
                  <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase">Client</p>
                </div>
                <div className="text-center">
                  {isAgencySigned ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-400 mx-auto" />}
                  <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase">Agence</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isFullySigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isFullySigned ? 'Signe' : 'En attente'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to={`/contracts/${contract.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
              >
                Ouvrir le contrat
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BookingContracts;
