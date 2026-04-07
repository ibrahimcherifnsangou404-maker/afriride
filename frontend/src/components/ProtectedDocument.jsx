import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchProtectedDocumentBlob = async (documentPath) => {
  const url = resolveMediaUrl(documentPath);
  if (!url) {
    throw new Error('Document introuvable');
  }

  const response = await fetch(url, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Impossible de charger le document');
  }

  return response.blob();
};

const useProtectedDocumentUrl = (documentPath, enabled = true) => {
  const [objectUrl, setObjectUrl] = useState('');
  const [loading, setLoading] = useState(Boolean(enabled && documentPath));
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    let nextObjectUrl = '';

    const load = async () => {
      if (!documentPath || !enabled) {
        setObjectUrl('');
        setLoading(false);
        setError('');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const blob = await fetchProtectedDocumentBlob(documentPath);
        if (isCancelled) return;

        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Impossible de charger le document');
          setObjectUrl('');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [documentPath, enabled]);

  return { objectUrl, loading, error };
};

export const openProtectedDocument = async (documentPath) => {
  const blob = await fetchProtectedDocumentBlob(documentPath);
  const objectUrl = URL.createObjectURL(blob);
  const popup = window.open(objectUrl, '_blank', 'noopener,noreferrer');

  if (!popup) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('La fenetre du document a ete bloquee par le navigateur');
  }

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
};

export function ProtectedDocumentImage({
  path,
  alt,
  className = '',
  fallback = null
}) {
  const { objectUrl, loading, error } = useProtectedDocumentUrl(path, Boolean(path));

  if (!path) {
    return fallback;
  }

  if (objectUrl) {
    return <img src={objectUrl} alt={alt} loading="lazy" decoding="async" className={className} />;
  }

  return (
    fallback || (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-4 text-center">
        <FileText className="w-8 h-8 mb-2" />
        <p className="text-xs">{loading ? 'Chargement du document...' : error || 'Document indisponible'}</p>
      </div>
    )
  );
}

export function ProtectedDocumentButton({
  path,
  children,
  className = '',
  onError
}) {
  const [opening, setOpening] = useState(false);
  const disabled = useMemo(() => !path || opening, [opening, path]);

  const handleClick = async () => {
    if (!path || opening) return;

    try {
      setOpening(true);
      await openProtectedDocument(path);
    } catch (err) {
      onError?.(err);
    } finally {
      setOpening(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={disabled} className={className}>
      {children || (
        <>
          Ouvrir
          <ExternalLink className="w-4 h-4" />
        </>
      )}
    </button>
  );
}
