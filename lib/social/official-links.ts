export const OFFICIAL_LINKS = {
  youtube: "https://www.youtube.com/@geekmyinterest",
  instagram: "https://www.instagram.com/geekmyinterest/",
  x: "https://x.com/geekmyinterest",
  spotify: "https://open.spotify.com/user/315cvio7n7papspsdnpay3pgm6ki",
  tiktok: "https://www.tiktok.com/@geek.my.interest",
} as const;

export function isExternalUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}
