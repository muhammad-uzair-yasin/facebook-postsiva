"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WHATSAPP_BUSINESS_NUMBER } from "@/lib/config";
import { deleteUserPhone, getUserPhone, setUserPhone } from "@/lib/hooks/userPhone/api";
import { Loader2 } from "lucide-react";

export default function WhatsappSettingsClient() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getUserPhone();
        setPhone(res.data?.phone_number ?? "");
        setSaved(Boolean(res.data?.phone_number));
      } catch {
        setPhone("");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await setUserPhone(phone.trim());
      setPhone(res.data?.phone_number ?? phone.trim());
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove linked WhatsApp number?")) return;
    setSaving(true);
    try {
      await deleteUserPhone();
      setPhone("");
      setSaved(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setSaving(false);
    }
  };

  const waDigits = WHATSAPP_BUSINESS_NUMBER.replace(/\D/g, "");

  return (
    <div>
      <Link href="/settings/integrations" className="mb-4 inline-block text-xs font-bold text-primary">
        ← Integrations
      </Link>
      <h2 className="text-2xl font-black text-slate-900">WhatsApp</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Link your WhatsApp number, then message {WHATSAPP_BUSINESS_NUMBER} to post via WhatsApp.
      </p>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <label className="mb-1 block text-xs font-bold text-slate-500">Phone number</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1…"
            className="mb-4 max-w-md rounded-xl"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? "Update" : "Save number"}
            </Button>
            {saved ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-red-600"
                disabled={saving}
                onClick={() => void handleRemove()}
              >
                Remove
              </Button>
            ) : null}
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Open WhatsApp
              </a>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
