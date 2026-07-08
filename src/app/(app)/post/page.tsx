import { redirect } from "next/navigation";

export default function LegacyPostRedirect() {
  redirect("/create");
}
