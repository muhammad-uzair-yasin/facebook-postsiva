"use client";

import type { ReactNode } from "react";
import { SettingsLayoutClient } from "./_components/SettingsLayoutClient";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
