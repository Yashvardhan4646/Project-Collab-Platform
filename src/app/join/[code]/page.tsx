"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data, error } = await supabase.rpc("redeem_invite", { p_code: code });
      if (!active) return;
      if (error) {
        const m = error.message || "";
        setError(
          m.includes("expired")
            ? "This invite has expired."
            : m.includes("exhausted")
            ? "This invite has been used up."
            : m.includes("not_found")
            ? "This invite is invalid."
            : "Couldn't join. Try again.",
        );
        return;
      }
      window.location.href = `/${data}`;
    })();
    return () => {
      active = false;
    };
  }, [code, supabase]);

  return (
    <main style={{ maxWidth: 420, margin: "18vh auto", padding: "0 1.5rem", fontFamily: "system-ui, sans-serif", textAlign: "center", color: "#ddd" }}>
      {error ? (
        <>
          <h1 style={{ fontSize: "1.4rem", color: "#fff" }}>Can&apos;t join</h1>
          <p style={{ color: "#f87171" }}>{error}</p>
          <a href="/desk" style={{ color: "#818cf8" }}>Back home</a>
        </>
      ) : (
        <p style={{ color: "#888" }}>Joining…</p>
      )}
    </main>
  );
}
