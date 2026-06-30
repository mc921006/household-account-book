import { getAIProvider } from "@/lib/ai/provider";
import {
  applyLocalTransactionRule,
  normalizeCategory,
  type QuickTransactionInput,
} from "@/lib/transactions/analyzer";
import { NextResponse } from "next/server";

type QuickClassifyRequest = {
  transactions?: QuickTransactionInput[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as QuickClassifyRequest;
  const transactions = body.transactions ?? [];
  const fallbackTransactions = transactions
    .map(
      (transaction): QuickTransactionInput => ({
        merchant: transaction.merchant?.trim() || transaction.rawText || "알 수 없음",
        amount: Number(transaction.amount) || 0,
        category: normalizeCategory(transaction.category),
        date: transaction.date?.trim(),
        memo: transaction.memo?.trim() || transaction.rawText?.trim(),
        type: transaction.type === "income" ? "income" : "expense",
        confidence:
          typeof transaction.confidence === "number" ? transaction.confidence : 0.35,
        rawText: transaction.rawText?.trim() || transaction.memo?.trim() || "",
      }),
    )
    .map(applyLocalTransactionRule);

  if (transactions.length === 0 || transactions.some((item) => !item.amount)) {
    return NextResponse.json(
      { transactions: [], error: "빠른 입력 로컬 분석 결과 배열이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const provider = getAIProvider();
    const analysis = await provider.refineQuickTransactions(fallbackTransactions);

    return NextResponse.json({
      transactions: analysis.transactions,
      error: analysis.error,
    });
  } catch (error) {
    console.warn(
      "Quick transaction AI refinement failed. Returning local candidates.",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      {
        transactions: fallbackTransactions,
        error:
          error instanceof Error
            ? error.message
            : "빠른 입력 보정 중 오류가 발생했습니다.",
      },
    );
  }
}
