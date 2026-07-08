"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);
  return (
    <p className="text-sm text-slate-500">Redirecting to profile…</p>
  );
}
