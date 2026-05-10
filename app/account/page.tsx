import { redirect } from "next/navigation";

/** Legacy `/account` → canonical settings URL. */
export default function AccountRedirectPage() {
  redirect("/account/settings");
}
