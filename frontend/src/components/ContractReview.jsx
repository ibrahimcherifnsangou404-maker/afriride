import { useState, useEffect } from 'react';
import { FileText, CheckCircle, X, AlertCircle, Download } from 'lucide-react';
import { contractService } from '../services/contractService';
import { Skeleton } from './UI';

function ContractReview({ bookingId, onAccept, onCancel }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptanceChecked, setAcceptanceChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contractService.generateContractContent({ bookingId });
      setContract(response.data.data);
    } catch (err) {
      console.error('Erreur chargement contrat:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    setScrolled(isAtBottom);
  };

  const handleAccept = async () => {
    if (!acceptanceChecked) {
      alert('Veuillez cocher la case pour accepter les conditions');
      return;
    }

    try {
      await onAccept();
    } catch (err) {
      console.error('Erreur acceptation contrat:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de l\'acceptation du contrat';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleDownload = () => {
    if (!contract) return;
    const blob = new Blob([contract.content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrat_${contract.contractNumber}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-10 w-40 mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-lg p-8 border border-red-200">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
          <h3 className="text-lg font-bold text-red-700">Erreur</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadContract}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Reessayer
        </button>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Contrat de Location</h2>
              <p className="text-green-100">{contract.contractNumber}</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            Telecharger
          </button>
        </div>
      </div>

      <div
        className="contract-viewer border-b-2 border-gray-200 bg-gray-50 p-6 overflow-y-auto"
        style={{ maxHeight: '500px' }}
        onScroll={handleScroll}
      >
        <div
          dangerouslySetInnerHTML={{ __html: contract.content }}
          className="prose prose-sm max-w-none"
          style={{ color: '#333', lineHeight: '1.6', fontSize: '14px' }}
        />
      </div>

      <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Important:</strong> Veuillez lire attentivement le contrat ci-dessus.
            En cochant la case ci-dessous, vous acceptez tous les termes et conditions.
          </p>
        </div>

        <div className="mb-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={acceptanceChecked}
              onChange={(e) => setAcceptanceChecked(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-1 cursor-pointer"
            />
            <span className="ml-3 text-sm text-gray-700">
              J'ai lu et j'accepte les <strong>conditions generales de location</strong> presentees
              dans le contrat ci-dessus. Je certifie avoir compris mes droits et obligations.
            </span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAccept}
            disabled={!acceptanceChecked}
            className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center transition ${
              acceptanceChecked
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Accepter et continuer
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold flex items-center justify-center transition"
          >
            <X className="w-5 h-5 mr-2" />
            Annuler
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          {!scrolled && <p className="text-gray-600">Veuillez faire defiler et lire le contrat entierement</p>}
        </div>
      </div>
    </div>
  );
}

export default ContractReview;
