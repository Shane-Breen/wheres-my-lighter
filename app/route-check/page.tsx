export default function RouteCheck() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="text-6xl mb-4">✅</div>

        <h1 className="text-2xl font-extrabold tracking-tight">
          Route Check
        </h1>

        <p className="mt-3 text-white/70">
          Routing is working correctly.
        </p>

        <div className="mt-6 text-sm text-white/40">
          <span className="font-mono">/route-check</span>
        </div>
      </div>
    </main>
  );
}
