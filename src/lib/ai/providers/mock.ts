import type { AIProvider } from "@/lib/ai/types";
import { applyLocalTransactionRule } from "@/lib/transactions/analyzer";

export const mockAIProvider: AIProvider = {
  name: "mock",
  async refineQuickTransactions(input) {
    return { transactions: input.map(applyLocalTransactionRule) };
  },
};
