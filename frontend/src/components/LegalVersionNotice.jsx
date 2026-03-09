export default function LegalVersionNotice({
  version = 'v2026-03-08',
  updatedAt = '8 mars 2026',
  changes = []
}) {
  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Version du document: {version}</p>
      <p className="text-xs text-slate-600">Dernière mise à jour: {updatedAt}</p>
      {changes.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {changes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

