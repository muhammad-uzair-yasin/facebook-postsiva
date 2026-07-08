"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CommentsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/inbox");
  }, [router]);
  return <p className="p-8 text-sm text-slate-500">Redirecting to Inbox…</p>;
}
