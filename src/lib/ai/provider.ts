import "server-only";

import type { AIProvider } from "@/lib/ai/types";
import { mockAIProvider } from "@/lib/ai/providers/mock";
import { openRouterAIProvider } from "@/lib/ai/providers/openrouter";

export type AIProviderName = "mock" | "openrouter";

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "openrouter") as AIProviderName;

  if (provider === "mock") {
    return mockAIProvider;
  }

  return openRouterAIProvider;
}
