import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-public-url";

const siteUrl = getPublicSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/login",
          "/signup",
          "/complete-profile",
          "/update-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
