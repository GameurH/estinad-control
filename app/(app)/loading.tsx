export default function AppLoading() {
  return (
    <div className="animate-pulse px-6 py-5 lg:px-8">
      <div className="mb-2 h-3 w-24 bg-surface-2" />
      <div className="mb-6 h-6 w-56 bg-surface-2" />
      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card p-5">
            <div className="mb-3 h-2.5 w-16 bg-surface-2" />
            <div className="h-8 w-14 bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-64 w-full bg-surface-2" />
    </div>
  );
}
