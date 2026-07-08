"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BillingUnavailableProps {
  title?: string;
}

export function BillingUnavailable({
  title = "Billing unavailable",
}: BillingUnavailableProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="mt-3 text-sm font-medium text-slate-500">
          The old Facebook billing flow has been removed. Paddle billing will be added later.
        </p>
        <Link href="/profile" className="mt-6 inline-block">
          <Button className="rounded-xl">Back to profile</Button>
        </Link>
      </div>
    </div>
  );
}
