"use client";

import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonaData } from "@/lib/hooks/facebook/persona/types";
import {
  PERSONA_SECTIONS,
  getSectionData,
  setSectionData,
} from "./personaFieldConfig";
import { PersonaFieldInput } from "./PersonaFieldInput";

export interface PersonaFormEditorProps {
  value: PersonaData;
  onChange: (next: PersonaData) => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  title?: string;
}

export function PersonaFormEditor({
  value,
  onChange,
  onSave,
  onCancel,
  saving = false,
  title = "Edit persona",
}: PersonaFormEditorProps) {
  const updateField = (
    sectionId: keyof PersonaData,
    fieldKey: string,
    fieldValue: unknown,
  ) => {
    const section = getSectionData(value, sectionId);
    onChange(setSectionData(value, sectionId, { ...section, [fieldKey]: fieldValue }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="rounded-xl">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSave()} disabled={saving} className="rounded-xl">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save persona
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {PERSONA_SECTIONS.map((section) => {
          const Icon = section.icon;
          const sectionData = getSectionData(value, section.id);
          return (
            <section
              key={section.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-primary">
                <Icon className="h-4 w-4 shrink-0" />
                <h3 className="text-sm font-black">{section.title}</h3>
              </div>
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      {field.label}
                    </label>
                    <PersonaFieldInput
                      field={field}
                      value={sectionData[field.key]}
                      disabled={saving}
                      onChange={(v) => updateField(section.id, field.key, v)}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
