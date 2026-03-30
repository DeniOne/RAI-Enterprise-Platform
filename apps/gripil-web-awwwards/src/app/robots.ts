import type { MetadataRoute } from "next";
import { getSiteProfile } from "@/lib/site-profile";

export default function robots(): MetadataRoute.Robots {
  const profile = getSiteProfile();
  const sitemap = new URL("/sitemap.xml", profile.siteUrl).toString();

  if (!profile.allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      host: profile.siteUrl.origin,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap,
    host: profile.siteUrl.origin,
  };
}
