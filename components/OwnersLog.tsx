type Owner = {
  anon_holder_id: string;
  display_name?: string | null;
  tap_count: number;
  last_town?: string | null;
  last_country?: string | null;
};

function shortId(id: string) {
  return id.replace(/-/g, "").slice(0, 4).toUpperCase();
}

export default function OwnersLog({ owners }: { owners: Owner[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm tracking-wider text-white/80 mb-3">
        OWNERS LOG
      </div>

      {owners.length === 0 && (
        <div className="text-white/50 text-sm">No owners yet</div>
      )}

      <div className="space-y-2">
        {owners.map((o) => (
          <div
            key={o.anon_holder_id}
            className="flex justify-between items-center rounded-xl bg-black/20 border border-white/10 px-3 py-2"
          >
            <div>
              <div className="text-sm text-white">
                {o.display_name || `Anonymous #${shortId(o.anon_holder_id)}`}
              </div>
              <div className="text-xs text-white/50">
                {[o.last_town, o.last_country].filter(Boolean).join(", ")}
              </div>
            </div>
            <div className="text-sm text-white/70">{o.tap_count} taps</div>
          </div>
        ))}
      </div>
    </div>
  );
}

