const JobDetailsSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Card */}
      <div className="border border-zinc-200 p-6 rounded-xl shadow-sm space-y-4">
        {/* Logo & Job Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-300 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="w-48 h-4 bg-zinc-300 rounded" />
            <div className="w-36 h-3 bg-zinc-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-zinc-200 rounded-full" />
            <div className="w-20 h-6 bg-zinc-200 rounded-full" />
          </div>
        </div>

        {/* Tags and Details Row */}
        <div className="flex flex-wrap justify-between mt-4">
          <div className="w-28 h-4 bg-zinc-200 rounded" />
          <div className="w-28 h-4 bg-zinc-200 rounded" />
          <div className="w-28 h-4 bg-zinc-200 rounded" />
          <div className="w-28 h-4 bg-zinc-200 rounded" />
        </div>

        {/* Bottom action */}
        <div className="w-64 h-4 bg-zinc-300 rounded mt-4" />
      </div>

      {/* Grid Layout - About and Skills */}
      <div className="grid grid-cols-1 mt-8 lg:grid-cols-3 gap-6">
        {/* About Internship */}
        <div className="lg:col-span-2 space-y-4 border border-zinc-200 p-4 rounded-xl">
          <div className="w-40 h-5 bg-zinc-300 rounded" />
          <div className="space-y-2">
            <div className="w-full h-3 bg-zinc-200 rounded" />
            <div className="w-full h-3 bg-zinc-200 rounded" />
            <div className="w-3/4 h-3 bg-zinc-200 rounded" />
            <div className="w-2/3 h-3 bg-zinc-200 rounded" />
            <div className="w-1/2 h-3 bg-zinc-200 rounded" />
          </div>
        </div>

        {/* Skills + Preferences */}
        <div className="space-y-4 border border-zinc-200 p-4 rounded-xl">
          <div className="space-y-2">
            <div className="w-40 h-4 bg-zinc-300 rounded" />
            <div className="flex gap-2 flex-wrap">
              <div className="w-16 h-6 bg-zinc-200 rounded-full" />
              <div className="w-20 h-6 bg-zinc-200 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-40 h-4 bg-zinc-300 rounded" />
            <div className="flex gap-2 flex-wrap">
              <div className="w-16 h-6 bg-zinc-200 rounded-full" />
              <div className="w-20 h-6 bg-zinc-200 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-36 h-4 bg-zinc-300 rounded" />
            <div className="w-28 h-3 bg-zinc-200 rounded" />
            <div className="w-32 h-3 bg-zinc-200 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-end gap-4 mt-4">
        <div className="w-28 h-10 bg-zinc-300 rounded-lg" />
        <div className="w-28 h-10 bg-zinc-300 rounded-lg" />
      </div>
    </div>
  )
}

export default JobDetailsSkeleton
