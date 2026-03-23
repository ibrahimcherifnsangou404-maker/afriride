import { Skeleton } from './UI';

function VehicleCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Skeleton className="skeleton absolute inset-0 rounded-none" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Skeleton className="skeleton h-7 w-24 rounded-full" />
          <Skeleton className="skeleton h-7 w-16 rounded-full" />
        </div>
        <Skeleton className="skeleton absolute right-3 top-3 h-10 w-10 rounded-full" />
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          <Skeleton className="skeleton h-1.5 w-4 rounded-full" />
          <Skeleton className="skeleton h-1.5 w-1.5 rounded-full" />
          <Skeleton className="skeleton h-1.5 w-1.5 rounded-full" />
        </div>
      </div>

      <div className="flex h-[18rem] flex-col p-5">
        <div className="mb-4">
          <Skeleton className="skeleton h-7 w-3/4" />
          <Skeleton className="skeleton mt-3 h-4 w-24" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center">
              <Skeleton className="skeleton mr-2 h-8 w-8 rounded-lg" />
              <Skeleton className="skeleton h-4 flex-1" />
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="w-1/2">
            <Skeleton className="skeleton h-3 w-20" />
            <Skeleton className="skeleton mt-2 h-8 w-28" />
          </div>
          <Skeleton className="skeleton h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default VehicleCardSkeleton;
