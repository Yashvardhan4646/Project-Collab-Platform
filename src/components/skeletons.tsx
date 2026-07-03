// Shown by loading.tsx while a channel server-renders, so the pane is never
// blank. Shaped like the chat that's about to load.
export function ChannelSkeleton() {
  const lines = [78, 54, 66, 42, 70, 50];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
      <div style={{ padding: "13px 20px", borderBottom: "1px solid #262626", display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skel" style={{ width: 110, height: 15 }} />
      </div>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18, overflow: "hidden" }}>
        {lines.map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 10 }}>
            <div className="skel" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <div className="skel" style={{ width: 90, height: 11 }} />
              <div className="skel" style={{ width: `${w}%`, height: 12, maxWidth: 520 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 20px", borderTop: "1px solid #262626" }}>
        <div className="skel" style={{ width: "100%", height: 40, borderRadius: 8 }} />
      </div>
    </div>
  );
}
