import { redirect } from "next/navigation";

export default function LegacyScheduledRedirect() {
  redirect("/posts/scheduled");
}
