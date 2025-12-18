export default function DemoPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #0b0f2a, #05060f)',
        color: '#eaeaf0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          Where’s My Lighter?
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            opacity: 0.75,
            marginBottom: '32px',
          }}
        >
          Objects drift. Hands change.  
          This lighter has a story — you’re just one chapter.
        </p>

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              opacity: 0.8,
              marginBottom: '16px',
            }}
          >
            Last seen:
          </p>

          <p
            style={{
              fontSize: '18px',
              fontWeight: 500,
              marginBottom: '8px',
            }}
          >
            A kitchen table
          </p>

          <p
            style={{
              fontSize: '13px',
              opacity: 0.6,
            }}
          >
            Skibbereen, West Cork
          </p>
        </div>

        {/* Action */}
        <button
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '12px',
            border: 'none',
            background: '#ffffff',
            color: '#05060f',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          I’ve got it now
        </button>

        {/* Footer note */}
        <p
          style={{
            fontSize: '12px',
            opacity: 0.5,
            marginTop: '20px',
          }}
        >
          Anonymous • No accounts • Just objects moving through people
        </p>
      </div>
    </main>
  )
}
