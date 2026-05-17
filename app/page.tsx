import { EditorialLeadSection } from "@/components/home/EditorialLeadSection";
import { LatestSection } from "@/components/home/LatestSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { buildHomepageData } from "@/lib/posts/homepage";
import {
  parseLatestListCat,
  parseLatestListPage,
} from "@/lib/posts/latest-list-params";
import { organizationSchema, webSiteSchema } from "@/lib/schema";
import { buildHomeMetadata } from "@/lib/seo";
import type { Metadata } from "next";

function homeCanonicalPath(
  cat: ReturnType<typeof parseLatestListCat>,
  page: number,
): string {
  const qs = new URLSearchParams();
  if (cat !== "all") qs.set("cat", cat);
  if (page > 1) qs.set("page", String(page));
  const q = qs.toString();
  return q ? `/?${q}` : "/";
}

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : undefined;
  const page = parseLatestListPage(sp?.page);
  const cat = parseLatestListCat(sp?.cat);
  const canonicalPath = homeCanonicalPath(cat, page);

  if (page > 1) {
    return buildHomeMetadata({
      title: `Geek My Interest | Anime, Gaming, Movies, Shows & Geek Culture · Page ${page}`,
      canonicalPath,
    });
  }

  return buildHomeMetadata({ canonicalPath });
}

export default async function Home({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const latestPage = parseLatestListPage(sp?.page);
  const latestCat = parseLatestListCat(sp?.cat);
  const { editorial, latest, latestMeta } = await buildHomepageData({
    latestPage,
    latestCat,
  });
  const adminDenied =
    process.env.NODE_ENV === "development" && sp?.adminDenied === "1";
  const denyReason =
    typeof sp?.reason === "string" ? sp.reason : undefined;

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <JsonLd data={[webSiteSchema(), organizationSchema()]} />
      <SiteBackdrop />
      {adminDenied ? (
        <div className="relative z-40 mx-auto max-w-[1800px] px-5 pt-24 text-sm text-amber-100 sm:px-8 lg:px-12">
          <div className="rounded-lg border border-amber-400/40 bg-amber-950/40 px-4 py-3">
            <strong className="font-semibold">Admin access denied (dev)</strong>
            {denyReason ? (
              <span className="ml-2 text-amber-200/90">
                Reason: <code className="text-cyan-200">{denyReason}</code> — no_profile: add RLS SELECT or{" "}
                <code className="text-cyan-200">SUPABASE_SERVICE_ROLE_KEY</code>; not_admin: set{" "}
                <code className="text-cyan-200">profiles.role = &apos;admin&apos;</code> for your user id.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <Navbar />
      <EditorialLeadSection editorial={editorial} />
      <LatestSection posts={latest} latestMeta={latestMeta} />
    </main>
  );
}
