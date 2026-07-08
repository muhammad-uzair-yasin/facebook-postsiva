"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Moved under Settings → Persona */
export default function PersonaRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/persona");
  }, [router]);
  return <p className="p-8 text-sm text-slate-500">Redirecting to Settings → Persona…</p>;
}
