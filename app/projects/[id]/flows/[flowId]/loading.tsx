import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header skeleton */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-36" />
            <div className="text-slate-400">/</div>
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-2/3 mt-2" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar skeleton */}
          <div className="w-[20%] min-w-[220px] max-w-[320px] h-full bg-white border-r p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border rounded-md p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          {/* Diagram area skeleton */}
          <div className="flex-1 h-full bg-white">
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 text-center">
                <Skeleton className="h-6 w-40 mx-auto" />
                <div className="border rounded-lg p-6">
                  <Skeleton className="h-[360px] w-[720px]" />
                </div>
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}