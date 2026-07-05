import type { MetadataRoute } from "next";

const base = "https://collabproject-vasu.vercel.app";

// Only the public entry points. Everything else is behind auth and redirects to
// /login, so there's nothing there for a crawler to index.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = "2026-07-05";
  return [
    { url: base, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/login`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
