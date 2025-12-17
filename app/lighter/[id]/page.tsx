export default function LighterPage({ params }: any) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px",
        fontFamily: "system-ui",
      }}
    >
      🔥 LIGHTER PAGE WORKS: {params?.id}
    </div>
  );
}
