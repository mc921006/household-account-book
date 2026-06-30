import type {
  QuickTransactionAnalysis,
  QuickTransactionInput,
} from "@/lib/transactions/analyzer";

export type AIProvider = {
  name: string;
  refineQuickTransactions(input: QuickTransactionInput[]): Promise<QuickTransactionAnalysis>;
};
