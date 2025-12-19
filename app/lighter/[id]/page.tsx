import Image from "next/image";

export default function LighterPage() {
  return (
    <div className="crt">
      <div className="panel">

        {/* HEADER */}
        <div className="header">
          <div className="logo">
            <Image
              src="/logo_app.png"
              alt="Where’s My Lighter"
              width={44}
              height={44}
              priority
            />
          </div>
          <div>
            <div className="title">Where’s My Lighter</div>
            <div className="subtitle">Tap to add a sighting</div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="progress">
          <div className="progressTop">
            <span>Hatching progress</span>
            <span>5/5 taps</span>
          </div>
          <div className="bar">
            <div style={{ width: "100%" }} />
          </div>
          <div className="small">
            Avatar + archetype unlock after 5 unique taps.
          </div>
        </div>

        {/* STATS */}
        <div className="grid">
          <div className="card">
            <div className="kicker">BORN</div>
            <div className="big">—</div>
            <div className="small">19 Dec 2025, 15:22</div>
          </div>

          <div className="card">
            <div className="kicker">OWNERS LOG</div>
            <div className="big">02</div>
            <div className="small">Unique holders</div>
          </div>

          <div className="card">
            <div className="kicker">HATCHLING</div>
            <div className="big">44</div>
            <div className="small">Total taps</div>
          </div>

          <div className="card">
            <div className="kicker">CURRENT LOCATION</div>
            <div className="small">Skibbereen, Éire / Ireland</div>
            <div className="small">19 Dec 2025, 20:04</div>
          </div>
        </div>

        {/* AVATAR */}
        <div className="avatar">
          <div className="avatarTop">
            <div className="avatarImg">
              <Image
                src="/avatars/caretaker.png"
                alt="The Caretaker"
                width={64}
                height={64}
              />
            </div>
            <div>
              <div className="avatarName">The Caretaker</div>
              <div className="avatarDesc">
                Always there, rarely far from home
              </div>
            </div>
          </div>
          <div className="avatarBottom">
            ● Avatar | The Caretaker
          </div>
        </div>

        {/* BUTTONS */}
        <div className="buttons">
          <button>Create Profile</button>
          <button className="primary">Tap Without Profile</button>
        </div>

        <div className="footer">
          Only nearest town is displayed publicly.
        </div>

      </div>
    </div>
  );
}
