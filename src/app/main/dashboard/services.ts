import { supabase } from "@/lib/supabase/client";
import type { QuickTransactionInput } from "@/lib/transactions/analyzer";
import type { AIRefineResult, DbTransactionRecord, LoginUser } from "./types";
import { findMissingColumn, normalizeDbTransaction } from "./utils";

export async function fetchCurrentUser(): Promise<LoginUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.log("USER ERROR:", error);
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
  };
}

export async function fetchTransactionPreviews(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbTransactionRecord[])
    .map(normalizeDbTransaction)
    .reverse();
}

export async function insertTransactionsWithFallback(
  userId: string,
  items: QuickTransactionInput[],
) {
  const rows = items.map((transaction) => ({
    user_id: userId,
    title: transaction.merchant.trim() || "거래",
    merchant: transaction.merchant.trim() || "알 수 없음",
    category: transaction.category.trim() || "기타",
    amount: transaction.amount,
    type: transaction.type,
    paid_at:
      transaction.date?.trim() ||
      new Date().toISOString().slice(0, 16).replace("T", " "),
    memo: transaction.memo?.trim() || transaction.rawText,
    source: "sms",
  }));
  const omittedColumns = new Set<string>();
  let error: unknown = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const payload = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([key]) => !omittedColumns.has(key)),
      ),
    );
    const result = await supabase.from("transactions").insert(payload);

    if (!result.error) {
      error = null;
      break;
    }

    error = result.error;
    const missingColumn = findMissingColumn(result.error);

    if (!missingColumn) {
      break;
    }

    omittedColumns.add(missingColumn);
  }

  if (error) {
    throw error;
  }

  return omittedColumns;
}

export async function refineTransactionsWithAI(
  items: QuickTransactionInput[],
): Promise<AIRefineResult> {
  const response = await fetch("/api/transactions/quick-classify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactions: items,
    }),
  });
  const data = (await response.json()) as {
    transactions?: QuickTransactionInput[];
    error?: string;
  };

  if (data.transactions) {
    return {
      transactions: data.transactions,
      error: data.error,
    };
  }

  if (!response.ok) {
    throw new Error(data.error ?? "AI 보정에 실패했습니다.");
  }

  return { transactions: items };
}
