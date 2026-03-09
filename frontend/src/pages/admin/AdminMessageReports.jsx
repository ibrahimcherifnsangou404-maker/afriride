import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Card, Button, Loading } from '../../components/UI';
import { adminService } from '../../services/adminService';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '-');

function AdminMessageReports() {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getMessageReports(status);
      setReports(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDecision = async (reportId, decision) => {
    const resolutionNote = window.prompt('Note de traitement (optionnel):', '') || '';
    try {
      setProcessingId(reportId);
      await adminService.reviewMessageReport(reportId, {
        status: decision,
        resolutionNote
      });
      await loadReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de traiter le signalement');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto max-w-7xl px-6 space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Modération messagerie</h1>
          <p className="text-slate-600 mt-1">Traitez les signalements de spam, abus et fraude.</p>
        </div>

        <div className="flex gap-2">
          {[
            { key: 'pending', label: 'En attente', icon: Clock3 },
            { key: 'resolved', label: 'Résolus', icon: CheckCircle2 },
            { key: 'rejected', label: 'Rejetés', icon: XCircle }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatus(item.key)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold ${
                status === item.key
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card className="p-0 overflow-hidden" hover={false}>
          {loading ? (
            <div className="p-8"><Loading size="sm" /></div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">Aucun signalement pour ce statut.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reports.map((report) => (
                <div key={report.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        {report.reason}
                      </p>
                      <p className="text-xs text-slate-600">Signalé le {formatDateTime(report.createdAt)}</p>
                      <p className="text-xs text-slate-600">
                        Reporter: {report.reporter?.firstName} {report.reporter?.lastName} ({report.reporter?.email})
                      </p>
                      <p className="text-xs text-slate-600">
                        Signalé contre: {report.reportedUser?.firstName} {report.reportedUser?.lastName} ({report.reportedUser?.email})
                      </p>
                      <p className="text-xs text-slate-600">Conversation: {report.conversationId}</p>
                      {report.messageId && (
                        <p className="text-xs text-slate-600">Message: {report.messageId}</p>
                      )}
                      {report.message?.content && (
                        <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2 mt-2">
                          {report.message.content}
                        </p>
                      )}
                      {report.details && (
                        <p className="text-xs text-slate-700">Détails: {report.details}</p>
                      )}
                      {report.resolutionNote && (
                        <p className="text-xs text-emerald-700">Note admin: {report.resolutionNote}</p>
                      )}
                    </div>

                    {report.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={processingId === report.id}
                          onClick={() => handleDecision(report.id, 'resolved')}
                        >
                          Marquer résolu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === report.id}
                          onClick={() => handleDecision(report.id, 'rejected')}
                        >
                          Rejeter
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600">
                        Traité le {formatDateTime(report.reviewedAt)}
                        {report.reviewer ? ` par ${report.reviewer.firstName} ${report.reviewer.lastName}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminMessageReports;
