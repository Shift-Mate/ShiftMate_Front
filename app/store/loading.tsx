export default function StoreLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden">
        <div className="h-20 shrink-0" />
        <main className="flex-1 overflow-hidden p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="h-6 w-56 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 h-4 w-80 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
