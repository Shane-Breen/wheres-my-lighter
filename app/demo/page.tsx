"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex items-center justify-center">
      <div className="rounded-3xl bg-white/10 p-6 max-w-md w-full">
        <h1 className="text-2xl font-semibold">Where’s My Lighter</h1>
        <p className="text-sm opacity-80 mt-2">
          Demo preview for NFC-powered lighter journeys.
        </p>

        <Link
          href="/lighter/pilot-002"
          className="block mt-4 rounded-2xl bg-purple-600 py-3 text-center font-semibold"
        >
          Open Demo Lighter
        </Link>

        <div className="mt-4 text-xs opacity-70">
          NFC tags should link to:
          <div className="font-mono mt-1">
            /lighter/&lt;LIGHTER_ID&gt;
          </div>
        </div>
      </div>
    </div>
  );
}
