export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Where’s My Lighter?
        </h1>

        <p className="mt-3 text-white/70">
          Demo links for presentation:
        </p>

        <div className="mt-6 grid gap-3">
          <a
            className="rounded-2xl border border-white/10 bg-purple-600/30 hover:bg-purple-600/40 px-5 py-4 font-semibold"
            href="/lighter/pilot-002?demo=1"
          >
            Open Demo (pilot-002)
          </a>

          <a
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-4 font-semibold"
            href="/lighter/test-001?demo=1"
          >
            Open Demo (test-001)
          </a>

          <a
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-4 font-semibold"
            href="/route-check"
          >
            Route Check
          </a>
        </div>

        <p className="mt-6 text-xs text-white/40">
          Tip: add <span className="font-mono">?demo=1</span> for clean partner-ready UI.
        </p>
      </div>
    </main>
  );
}
