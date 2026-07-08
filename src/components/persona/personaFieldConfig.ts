import type { LucideIcon } from "lucide-react";
import { FileText, Hash, Lightbulb, Palette, Users } from "lucide-react";
import type { PersonaData } from "@/lib/hooks/facebook/persona/types";

export type PersonaFieldType = "text" | "textarea" | "select" | "tags";

export interface PersonaFieldDef {
  key: string;
  label: string;
  type: PersonaFieldType;
  suggestions?: string[];
  placeholder?: string;
}

export interface PersonaSectionDef {
  id: keyof PersonaData;
  title: string;
  icon: LucideIcon;
  fields: PersonaFieldDef[];
}

export const PERSONA_SECTIONS: PersonaSectionDef[] = [
  {
    id: "audience_analysis",
    title: "Audience Analysis",
    icon: Users,
    fields: [
      {
        key: "target_audience",
        label: "Target audience",
        type: "textarea",
        placeholder: "Who reads your page? e.g. marketers learning AI tools",
      },
      {
        key: "audience_demographics",
        label: "Audience demographics",
        type: "tags",
        suggestions: [
          "Entrepreneurs",
          "Students",
          "Developers",
          "Marketers",
          "Small business owners",
          "Content creators",
        ],
      },
      {
        key: "skill_level",
        label: "Skill level",
        type: "select",
        suggestions: ["beginner", "intermediate", "advanced", "all_levels"],
      },
      {
        key: "audience_interests",
        label: "Audience interests",
        type: "tags",
        suggestions: ["AI", "Marketing", "Productivity", "Social media", "Automation"],
      },
      {
        key: "viewer_intent",
        label: "Viewer intent",
        type: "tags",
        suggestions: ["learning", "inspiration", "problem solving", "entertainment", "news"],
      },
      {
        key: "pain_points_addressed",
        label: "Pain points addressed",
        type: "textarea",
        placeholder: "What problems does your content solve?",
      },
    ],
  },
  {
    id: "content_patterns",
    title: "Content Patterns",
    icon: FileText,
    fields: [
      {
        key: "post_naming_convention",
        label: "Post naming convention",
        type: "text",
        suggestions: [
          "Part [NUMBER] | [EMOJI] [TOPIC]",
          "[EMOJI] [TOPIC] — Quick tip",
          "How to [TOPIC] in [TIME]",
        ],
      },
      {
        key: "content_formula",
        label: "Content formula",
        type: "text",
        suggestions: [
          "Hook → Value → Call to action",
          "Problem → Solution → Result",
          "Story → Lesson → Ask",
        ],
      },
      {
        key: "post_title_style",
        label: "Post title style",
        type: "select",
        suggestions: ["descriptive", "question", "catchy", "minimal", "listicle"],
      },
      {
        key: "emoji_usage",
        label: "Emoji usage",
        type: "select",
        suggestions: ["frequently", "occasionally", "rarely", "never"],
      },
    ],
  },
  {
    id: "writing_style",
    title: "Writing Style",
    icon: Palette,
    fields: [
      {
        key: "tone",
        label: "Tone",
        type: "select",
        suggestions: [
          "enthusiastic_motivational",
          "professional",
          "casual_friendly",
          "educational",
          "humorous",
          "inspirational",
        ],
      },
      {
        key: "formality",
        label: "Formality",
        type: "select",
        suggestions: ["casual", "semi_formal", "formal"],
      },
      {
        key: "sentence_length",
        label: "Sentence length",
        type: "select",
        suggestions: ["short", "medium", "long"],
      },
      {
        key: "characteristics",
        label: "Characteristics",
        type: "tags",
        suggestions: [
          "uses_emojis",
          "short_sentences",
          "asks_questions",
          "uses_bullet_points",
          "storytelling",
          "data_driven",
        ],
      },
    ],
  },
  {
    id: "topics_and_keywords",
    title: "Topics & Keywords",
    icon: Hash,
    fields: [
      {
        key: "primary_topic",
        label: "Primary topic",
        type: "text",
        placeholder: "e.g. Artificial Intelligence",
      },
      {
        key: "common_keywords",
        label: "Common keywords",
        type: "tags",
        suggestions: ["AI", "automation", "tips", "tutorial", "growth", "tools"],
      },
    ],
  },
  {
    id: "ai_insights",
    title: "AI Insights",
    icon: Lightbulb,
    fields: [
      {
        key: "content_generation_guidelines",
        label: "Content guidelines",
        type: "tags",
        suggestions: [
          "Keep posts clear and actionable",
          "Use simple language",
          "Add a call to action",
          "Stay on brand",
        ],
      },
      {
        key: "style_characteristics",
        label: "Style characteristics",
        type: "tags",
        suggestions: ["conversational", "bold hooks", "educational", "visual-friendly"],
      },
    ],
  },
];

export function getSectionData(
  persona: PersonaData,
  sectionId: keyof PersonaData,
): Record<string, unknown> {
  const raw = persona[sectionId];
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export function setSectionData(
  persona: PersonaData,
  sectionId: keyof PersonaData,
  sectionData: Record<string, unknown>,
): PersonaData {
  return { ...persona, [sectionId]: sectionData };
}
