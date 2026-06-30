import type { QuickTransactionInput } from "@/lib/transactions/analyzer";

export type LoginUser = {
  id: string;
  email: string;
};

export type TransactionPreview = {
  id: string;
  title: string;
  merchant: string;
  category: string;
  amount: number;
  type: "expense" | "income";
  paidAt: string;
  source: "sms" | "manual" | "db";
};

export type DbTransactionRecord = {
  id?: string | number | null;
  title?: string | null;
  merchant?: string | null;
  category?: string | null;
  amount?: string | number | null;
  type?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  source?: string | null;
};

export type MerchantCategoryMapping = {
  merchant: string;
  category: string;
};

export type CategorySpending = {
  category: string;
  amount: number;
  ratio: number;
};

export type AIRefineResult = {
  transactions: QuickTransactionInput[];
  error?: string;
};
