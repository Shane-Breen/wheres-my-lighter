return (
  <div className="app">
    <div className="phone">
      <header className="topbar">
        <div className="title">LIGHTER</div>
        <div className="time">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </header>

      <section className="card hero">
        <div className="avatar">🌙</div>
        <div className="meta">
          <div><b>Archetype:</b> The Night Traveller</div>
          <div><b>Pattern:</b> Nocturnal</div>
          <div><b>Style:</b> Social</div>
          <div><b>Possession Streak:</b> 07 Days</div>
          <div><b>Total Losses:</b> 03</div>
        </div>
      </section>

      <section className="card">
        <h3>Journey (Factual)</h3>
        <div className="grid2">
          <div className="pill">First carried in <span className="hot">BERLIN</span></div>
          <div className="pill">Roamed crowded streets and <span className="hot">SILENT CORNERS</span></div>
        </div>
        <div className="pill wide">Last seen outside <span className="hot">BERGHAIN</span> at 5:04am</div>
      </section>

      <section className="card">
        <h3>Campfire Story (Legend)</h3>
        <div className="pill wide">⭐ It leaves a spark of curiosity wherever it travels.</div>
      </section>

      <section className="card">
        <h3>ACTIONS</h3>
        <div className="actions">
          <button className="btn">☺︎ PROFILE</button>
          <button className="btn">⚑ LOCATION</button>
          <button className="btn">♥ SOCIAL</button>
          <button className="btn">◎ PING</button>
        </div>
      </section>

      <nav className="tabs">
        <div className="tab">HOME</div>
        <div className="tab active">LIGHTER</div>
        <div className="tab">SETTINGS</div>
      </nav>
    </div>

    <style jsx>{`
      .app{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070716;padding:24px}
      .phone{width:390px;max-width:92vw;border-radius:26px;overflow:hidden;background:linear-gradient(180deg,#0b1f3a 0%, #0a0920 45%, #050515 100%);box-shadow:0 30px 80px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.08)}
      .topbar{display:flex;justify-content:space-between;align-items:center;padding:18px 18px 14px;color:#eaf2ff;background:rgba(10,25,50,.55)}
      .title{font-weight:800;letter-spacing:.6px}
      .time{opacity:.85;font-weight:700}
      .card{margin:14px 16px;padding:16px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);color:#eaf2ff}
      .hero{display:flex;gap:14px;align-items:center}
      .avatar{width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:rgba(40,90,255,.15);font-size:30px}
      .meta{font-size:14px;line-height:1.55;opacity:.95}
      h3{margin:0 0 10px;font-size:16px;color:#a9c6ff;letter-spacing:.3px}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
      .pill{padding:14px;border-radius:14px;background:rgba(110,40,255,.35);border:1px solid rgba(180,120,255,.25);font-weight:700}
      .pill.wide{width:100%;text-align:center}
      .hot{color:#ff2d7a}
      .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .btn{padding:14px 12px;border-radius:14px;border:1px solid rgba(180,120,255,.25);background:rgba(110,40,255,.45);color:#fff;font-weight:900;letter-spacing:.3px}
      .tabs{display:flex;justify-content:space-around;padding:14px 12px;color:#cfe0ff;background:rgba(10,25,50,.65);border-top:1px solid rgba(255,255,255,.08)}
      .tab{opacity:.75;font-weight:900}
      .tab.active{opacity:1;text-decoration:underline;text-underline-offset:8px}
    `}</style>
  </div>
);
