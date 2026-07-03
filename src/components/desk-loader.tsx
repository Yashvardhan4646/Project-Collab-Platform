"use client";

import { useEffect, useState } from "react";

// The four squares are the cubicle mark from the design docs. They breathe in
// sequence while a terminal-style line cycles through what the app is actually
// fetching, so even the loading state says "this is a workspace, not a chat app."
const LINES = ["opening your desk", "pulling your teams", "checking what's due", "warming up the board"];

export function DeskLoader() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "#0a0a0a",
        fontFamily: "var(--font-geist-mono), ui-monospace, 'Cascadia Code', Menlo, monospace",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 24px)", gridTemplateRows: "repeat(2, 24px)", gap: 7 }}>
        {/* delays run clockwise: top-left, top-right, bottom-right, bottom-left */}
        {[0, 0.16, 0.48, 0.32].map((d, i) => (
          <div key={i} className="cube" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#8a8a8a", letterSpacing: "0.01em", minHeight: 18 }}>
        {LINES[i]}
        <span className="cur">▋</span>
      </div>
    </div>
  );
}
