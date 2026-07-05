import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";

export const metadata = {
  title: "Collab Platform, a shared workspace for small teams",
};

const features: { title: string; body: string }[] = [
  { title: "Team chat", body: "Text channels with live typing, who's around, and image uploads. Edit or delete your own messages." },
  { title: "Direct messages", body: "Message anyone by their @username, even before you share a team." },
  { title: "Task boards", body: "A board for each team. Assign tasks, set due dates, and see what's waiting on you." },
  { title: "Shared notes", body: "Notes that save as you type and update for everyone at once." },
  { title: "Whiteboard", body: "Sketch together on a live canvas. You see each other's cursors move." },
  { title: "Voice and video", body: "Start a call in one click. It runs peer-to-peer in the browser, with no separate app to install." },
  { title: "Reminders", body: "A running checklist with due times, so nothing slips." },
  { title: "Embedded docs", body: "Drop a Google Doc, Sheet, or Slides file straight into a channel." },
  { title: "Private cubicle", body: "A space only you can see, for your own notes and drafts." },
];

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/desk"); // returning members skip the pitch

  return (
    <main style={{ background: "#0a0a0a", color: "#ededed", minHeight: "100dvh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 24px" }}>
        {/* Nav */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 0" }}>
          <span style={{ fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>Collab Platform</span>
          <Link href="/login" style={{ color: "#c7c9ff", textDecoration: "none", fontSize: 14 }}>
            Sign in
          </Link>
        </header>

        {/* Hero */}
        <section style={{ padding: "72px 0 56px", maxWidth: 720 }}>
          <div style={{ color: "#818cf8", fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 18 }}>COLLAB PLATFORM</div>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.05, fontWeight: 800, color: "#fff", margin: 0 }}>
            Run your team&apos;s work in one place.
          </h1>
          <p style={{ fontSize: "clamp(16px, 2.4vw, 20px)", color: "#a3a3a3", lineHeight: 1.55, marginTop: 20 }}>
            Chat, direct messages, task boards, notes, reminders, a whiteboard, and calls. One workspace for a small
            team, instead of five open tabs.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "#4f46e5", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 600 }}>
              Get started
            </Link>
            <Link href="/login" style={{ color: "#a3a3a3", textDecoration: "none", fontSize: 15 }}>
              Already have an account? Sign in
            </Link>
          </div>
        </section>

        {/* Desk callout */}
        <section style={{ padding: "8px 0 48px" }}>
          <div style={{ background: "#141414", border: "1px solid #262626", borderRadius: 16, padding: "28px 30px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Start at your desk</h2>
            <p style={{ color: "#a3a3a3", fontSize: 16, lineHeight: 1.6, marginTop: 12, marginBottom: 0, maxWidth: 620 }}>
              Your desk is the first thing you see. It pulls together the tasks assigned to you, your teams, and your
              conversations, so you always know where to pick up.
            </p>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "8px 0 24px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Everything the team needs, in one app</h2>
          <p style={{ color: "#777", fontSize: 15, margin: "0 0 28px" }}>Each team is a set of channels. Pick the type that fits the work.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: "20px 20px" }}>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: "#9a9a9a", fontSize: 14, lineHeight: 1.55 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section style={{ padding: "56px 0", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, color: "#fff", margin: 0 }}>Get your team on one page.</h2>
          <div style={{ marginTop: 26 }}>
            <Link href="/login" style={{ background: "#4f46e5", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 600 }}>
              Get started
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #1c1c1c", padding: "24px 0 48px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, color: "#666", fontSize: 13 }}>
          <span>Collab Platform</span>
          <span>Built with Next.js and Supabase.</span>
        </footer>
      </div>
    </main>
  );
}
