"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PersonaFieldDef } from "./personaFieldConfig";

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface PersonaFieldInputProps {
  field: PersonaFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function PersonaFieldInput({
  field,
  value,
  onChange,
  disabled,
}: PersonaFieldInputProps) {
  const tags = parseTags(value);

  const addSuggestion = (suggestion: string) => {
    if (field.type !== "tags") return;
    if (tags.includes(suggestion)) return;
    onChange([...tags, suggestion]);
  };

  if (field.type === "select") {
    const options = field.suggestions ?? [];
    const current = String(value ?? "");
    return (
      <div className="space-y-2">
        <select
          value={current}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          <option value="">Choose…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {formatLabel(opt)}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                current === opt
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {formatLabel(opt)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "tags") {
    return (
      <div className="space-y-2">
        <Input
          value={tags.join(", ")}
          disabled={disabled}
          placeholder={field.placeholder || "Comma-separated values"}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className="rounded-xl"
        />
        {field.suggestions?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {field.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => addSuggestion(s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                  tags.includes(s)
                    ? "bg-primary/15 text-primary"
                    : "bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary",
                )}
              >
                + {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        value={String(value ?? "")}
        disabled={disabled}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[88px] rounded-xl bg-white"
      />
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={String(value ?? "")}
        disabled={disabled}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl"
      />
      {field.suggestions?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {field.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onChange(s)}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-primary/10 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function formatPersonaDisplayValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value == null || value === "") return "—";
  return String(value).replace(/_/g, " ");
}
