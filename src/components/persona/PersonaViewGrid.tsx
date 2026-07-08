"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonaData } from "@/lib/hooks/facebook/persona/types";
import { PERSONA_SECTIONS, getSectionData } from "./personaFieldConfig";
import { formatPersonaDisplayValue } from "./PersonaFieldInput";

export function PersonaViewGrid({ persona }: { persona: PersonaData }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {PERSONA_SECTIONS.filter((s) => s.id !== "ai_insights").map((section) => {
        const Icon = section.icon;
        const data = getSectionData(persona, section.id);
        return (
          <div
            key={section.id}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-primary">
              <Icon className="h-4 w-4" />
              <h3 className="text-sm font-black">{section.title}</h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(data).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <span className="min-w-[130px] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-900 break-words">
                    {formatPersonaDisplayValue(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {persona.ai_insights ? (
        <div className="lg:col-span-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-lg font-black text-slate-900">AI Insights</h3>
          </div>
          {persona.ai_insights.content_generation_guidelines?.length ? (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Guidelines</p>
              {persona.ai_insights.content_generation_guidelines.map((g, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-primary/10 bg-white/70 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-slate-700">{g}</span>
                </div>
              ))}
            </div>
          ) : null}
          {persona.ai_insights.style_characteristics?.length ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Style</p>
              <div className="flex flex-wrap gap-2">
                {persona.ai_insights.style_characteristics.map((c, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary",
                    )}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
