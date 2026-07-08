"use client";

import { use } from "react";
import IntegrationGuideClient from "../../_components/IntegrationGuideClient";

export default function SettingsIntegrationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <IntegrationGuideClient slug={slug} />;
}
