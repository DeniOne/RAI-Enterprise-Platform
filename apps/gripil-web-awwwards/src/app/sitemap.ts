import type { MetadataRoute } from "next";
import { getSiteProfile } from "@/lib/site-profile";

export default function sitemap(): MetadataRoute.Sitemap {
  const profile = getSiteProfile();
  const routes = ["/", "/privacy", "/company", "/contact"];

  return routes.map((path, index) => ({
    url: new URL(path, profile.siteUrl).toString(),
    lastModified: new Date("2026-03-29"),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.4,
  }));
}
