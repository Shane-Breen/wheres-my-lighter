import Image from "next/image";

type PageProps = {
  params: { id: string };
};

export default async function Page({ params }: PageProps) {
  const lighterId = params.id;

  // TEMP SAFE DATA (prevents runtime crash)
  const totalTaps = 73;
  const owners = 4;

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10">
        {/* ===== HEADER ===== */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(140,90,255,0.12)]">
          <div className="flex items-center gap-5">
            {/* LOGO */}
            <Image
              src="/logoo.png"
              alt="Where's My Lighter"
              width={120}
              height={120}
              className="logoFlicker"
              priority
            />

            {/* TITLE */}
            <div className="flex-1">
              <h1 className="wmyl-title">
                Where&apos;s My Lighter?
              </h1>
              <p className="wmyl-tagline">
                Tracking this tiny flame across the globe
              </p>
            </div>

            {/* STATS */}
            <div className="text-right">
              <div className="text-5xl font-semibold">{totalTaps}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                TOTAL TAPS
              </div>

              <div className="mt-3 text-2xl font-semibold">{owners}</div>
              <div className="text-[10px] tracking-[0.25em] text-white/50">
                OWNERS
              </div>
            </div>
          </div>
        </section>

        {/* ===== LOCATION ===== */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/20">
              🌙
            </div>
            <div>
              <div className="text-lg font-semibold">
                County Cork, Ireland
              </div>
              <div className="text-sm text-white/50">
                Last seen Jan 8, 2026
              </div>
              <div className="mt-1 text-xs text-white/40">
                Distance travelled: 0.3 km
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
