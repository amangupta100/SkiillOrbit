import { usePathname } from "next/navigation";


const JobSkeleton = ({ count }) => {
  const pathname = usePathname()
    return (
      <div className={`grid ${pathname.includes("recruiterDashboard") ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 mt-6"} gap-6`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-full">
           {pathname.includes("recruiterDashboard") ?  
           <div className="h-60 flex flex-col gap-4 w-full p-4 bg-gray-200 border-[1.6px] border-zinc-300 rounded animate-pulse">
              <div className="h-14 w-full bg-gray-300 rounded"></div>
              <div className="h-10 w-1/2 bg-gray-300 rounded"></div>
              <div className="h-10 w-full bg-gray-300 rounded"></div>
              <div className="h-10 w-1/2 bg-gray-300 rounded"></div>
            </div> 
            : 
    <div className="animate-pulse space-y-4 border border-zinc-200 p-6 rounded-xl shadow-sm">
      {/* Top Row - Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-300 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="w-40 h-4 bg-zinc-300 rounded" />
          <div className="w-32 h-3 bg-zinc-200 rounded" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap">
        <div className="w-16 h-6 bg-zinc-200 rounded-full" />
        <div className="w-20 h-6 bg-zinc-200 rounded-full" />
        <div className="w-14 h-6 bg-zinc-200 rounded-full" />
      </div>

      {/* Job Details (Stipend, Duration, etc.) */}
      <div className="flex flex-wrap justify-between gap-4 mt-2">
        <div className="w-24 h-4 bg-zinc-200 rounded" />
        <div className="w-24 h-4 bg-zinc-200 rounded" />
        <div className="w-24 h-4 bg-zinc-200 rounded" />
        <div className="w-24 h-4 bg-zinc-200 rounded" />
      </div>

      {/* Bottom CTA row */}
      <div className="flex flex-wrap justify-between items-center mt-4">
        <div className="w-40 h-4 bg-zinc-300 rounded" />
        <div className="flex gap-2 mt-2 sm:mt-0">
          <div className="w-24 h-9 bg-zinc-300 rounded-lg" />
          <div className="w-24 h-9 bg-zinc-300 rounded-lg" />
        </div>
      </div>
    </div>

           }
          </div>
        ))}
      </div>
    );
  };

export default JobSkeleton;