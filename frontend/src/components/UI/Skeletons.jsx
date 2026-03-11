const Block = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
);

const DarkBlock = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-lg bg-white/10 ${className}`} />
);

export function TableSkeleton({ rows = 6, columns = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-3">
        {Array.from({ length: columns }).map((_, idx) => (
          <Block key={`head-${idx}`} className="h-5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Block key={`cell-${rowIdx}-${colIdx}`} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ variant = 'default', className = '' }) {
  if (variant === 'cards') {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        <div className="container mx-auto px-6 py-12 max-w-6xl space-y-8">
          <div className="flex items-center justify-between gap-6">
            <Block className="h-8 w-64" />
            <Block className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                <Block className="h-44 w-full rounded-xl" />
                <Block className="h-6 w-3/4 mt-4" />
                <Block className="h-4 w-1/2 mt-2" />
                <Block className="h-10 w-full mt-6 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        <div className="container mx-auto px-6 py-10 max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-6">
            <Block className="h-8 w-56" />
            <Block className="h-10 w-40" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <TableSkeleton rows={6} columns={6} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        <div className="container mx-auto px-6 py-10 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Block className="h-8 w-2/3" />
              <Block className="h-80 w-full rounded-3xl" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Block key={idx} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <Block className="h-40 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Block className="h-12 w-2/3" />
              <Block className="h-64 w-full rounded-2xl" />
              <Block className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'chat') {
    return (
      <div className={`min-h-screen bg-[#0a0f1a] ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 py-10 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <DarkBlock className="h-10 w-3/4" />
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <DarkBlock className="h-4 w-2/3" />
                  <DarkBlock className="h-3 w-1/2" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-8 space-y-4">
              <DarkBlock className="h-12 w-1/2" />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <DarkBlock key={idx} className={`h-10 ${idx % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                ))}
              </div>
              <DarkBlock className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        <div className="container mx-auto px-6 py-16 max-w-xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
            <Block className="h-8 w-2/3" />
            {Array.from({ length: 5 }).map((_, idx) => (
              <Block key={idx} className="h-12 w-full" />
            ))}
            <Block className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        <div className="container mx-auto px-6 py-10 max-w-7xl space-y-8">
          <div className="flex items-center justify-between gap-6">
            <Block className="h-10 w-64" />
            <Block className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <Block className="h-10 w-10 rounded-2xl" />
                <Block className="h-5 w-24" />
                <Block className="h-8 w-32" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'payment') {
    return (
      <div className={`min-h-screen bg-slate-50 ${className}`}>
        <div className="container mx-auto px-6 py-12 max-w-5xl space-y-8">
          <Block className="h-10 w-72" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <Block className="h-6 w-48" />
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Block key={idx} className="h-12 w-full" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <Block className="h-6 w-32" />
                <Block className="h-10 w-full" />
                <Block className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${className}`}>
      <div className="container mx-auto px-6 py-12 max-w-5xl space-y-6">
        <Block className="h-8 w-64" />
        <Block className="h-4 w-1/2" />
        <Block className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
