import { redirect } from "next/navigation";

export default function LegacyPublishedRedirect() {
  redirect("/posts/published");
}
