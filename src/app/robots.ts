import type { MetadataRoute } from "next";

const base = "https://collabproject-vasu.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth callbacks and invite links carry tokens/codes — keep them out of the index.
      disallow: ["/auth/", "/join/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
