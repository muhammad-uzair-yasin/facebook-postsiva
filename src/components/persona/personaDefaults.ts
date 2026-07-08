import type { PersonaData } from "@/lib/hooks/facebook/persona/types";

/** Default empty persona template for manual creation. */
export function createEmptyPersona(): PersonaData {
  return {
    audience_analysis: {
      target_audience: "",
      audience_demographics: [],
      skill_level: "all_levels",
      audience_interests: [],
      viewer_intent: [],
      pain_points_addressed: [],
    },
    content_patterns: {
      post_naming_convention: "Part [NUMBER] | [EMOJI] [TOPIC]",
      content_formula: "Hook → Value → Call to action",
      post_title_style: "descriptive",
      emoji_usage: "occasionally",
    },
    writing_style: {
      tone: "professional",
      formality: "casual",
      sentence_length: "medium",
      characteristics: [],
    },
    topics_and_keywords: {
      primary_topic: "",
      common_keywords: [],
    },
    content_examples: {
      recent_posts: [],
    },
    ai_insights: {
      content_generation_guidelines: [
        "Keep posts clear and actionable",
        "Match your page voice consistently",
        "End with a question or call to action when appropriate",
      ],
      style_characteristics: [],
    },
  };
}

/** Merge partial edits and refresh ai_insights from style/topics. */
export function finalizePersonaForSave(draft: PersonaData): PersonaData {
  const tone = draft.writing_style?.tone || "professional";
  const formality = draft.writing_style?.formality || "casual";
  const topic = draft.topics_and_keywords?.primary_topic || "your niche";
  const characteristics = draft.writing_style?.characteristics ?? [];

  return {
    ...draft,
    ai_insights: {
      content_generation_guidelines:
        draft.ai_insights?.content_generation_guidelines?.length
          ? draft.ai_insights.content_generation_guidelines
          : [
              `Use a ${tone.replace(/_/g, " ")} tone with ${formality.replace(/_/g, " ")} language`,
              `Focus content on ${topic}`,
              `Emoji usage: ${draft.content_patterns?.emoji_usage || "occasionally"}`,
            ],
      style_characteristics:
        draft.ai_insights?.style_characteristics?.length
          ? draft.ai_insights.style_characteristics
          : characteristics,
    },
  };
}

export function clonePersona(data: PersonaData): PersonaData {
  return JSON.parse(JSON.stringify(data)) as PersonaData;
}
