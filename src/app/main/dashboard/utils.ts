import type { QuickTransactionInput } from "@/lib/transactions/analyzer";
import type {
  CategorySpending,
  DbTransactionRecord,
  MerchantCategoryMapping,
  TransactionPreview,
} from "./types";

export const moneyFormatter = new Intl.NumberFormat("ko-KR");

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
) {
  return `${padDatePart(year % 100)}/${padDatePart(month)}/${padDatePart(
    day,
  )} ${padDatePart(hour)}:${padDatePart(minute)}:${padDatePart(second)}`;
}

function isValidDatePart(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatTransactionDateTime(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "날짜 없음";
  }

  const dateTimeMatch = trimmedValue.match(
    /^(\d{2}|\d{4})[-./:](\d{1,2})[-./:](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  );

  if (dateTimeMatch) {
    const yearValue = Number(dateTimeMatch[1]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    const month = Number(dateTimeMatch[2]);
    const day = Number(dateTimeMatch[3]);

    if (isValidDatePart(year, month, day)) {
      return formatDateParts(
        year,
        month,
        day,
        Number(dateTimeMatch[4] ?? 0),
        Number(dateTimeMatch[5] ?? 0),
        Number(dateTimeMatch[6] ?? 0),
      );
    }
  }

  const monthDayTimeMatch = trimmedValue.match(
    /^(\d{1,2})[-./](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/,
  );

  if (monthDayTimeMatch) {
    const year = new Date().getFullYear();
    const month = Number(monthDayTimeMatch[1]);
    const day = Number(monthDayTimeMatch[2]);

    if (isValidDatePart(year, month, day)) {
      return formatDateParts(
        year,
        month,
        day,
        Number(monthDayTimeMatch[3]),
        Number(monthDayTimeMatch[4]),
        Number(monthDayTimeMatch[5] ?? 0),
      );
    }
  }

  const parsedDate = new Date(trimmedValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateParts(
      parsedDate.getFullYear(),
      parsedDate.getMonth() + 1,
      parsedDate.getDate(),
      parsedDate.getHours(),
      parsedDate.getMinutes(),
      parsedDate.getSeconds(),
    );
  }

  return trimmedValue;
}

export function normalizeDbTransaction(
  transaction: DbTransactionRecord,
  index: number,
): TransactionPreview {
  const type = transaction.type === "income" ? "income" : "expense";
  const amount =
    typeof transaction.amount === "number"
      ? transaction.amount
      : Number(String(transaction.amount ?? "0").replaceAll(",", ""));
  const title = transaction.title?.trim() || "제목 없음";

  return {
    id: String(transaction.id ?? `db-${index}`),
    title,
    merchant: transaction.merchant?.trim() || title,
    category:
      transaction.category?.trim() || (type === "income" ? "수입" : "기타"),
    amount: Number.isFinite(amount) ? amount : 0,
    type,
    paidAt: transaction.paid_at ?? transaction.created_at ?? "",
    source:
      transaction.source === "sms" || transaction.source === "manual"
        ? transaction.source
        : "db",
  };
}

export function normalizeMappingKey(merchant: string) {
  return merchant.trim().replace(/\s+/g, "").toLowerCase();
}

export function createMerchantCategoryMap(transactions: TransactionPreview[]) {
  return transactions.reduce<Map<string, MerchantCategoryMapping>>((acc, item) => {
    const key = normalizeMappingKey(item.merchant);

    if (key && item.category.trim() && !acc.has(key)) {
      acc.set(key, {
        merchant: item.merchant,
        category: item.category,
      });
    }

    return acc;
  }, new Map());
}

export function applySavedMerchantMapping(
  transaction: QuickTransactionInput,
  merchantCategoryMap: Map<string, MerchantCategoryMapping>,
) {
  const mapping = merchantCategoryMap.get(
    normalizeMappingKey(transaction.merchant),
  );

  if (!mapping) {
    return null;
  }

  if (mapping.category === "기타") {
    return null;
  }

  return {
    ...transaction,
    merchant: mapping.merchant,
    category: mapping.category,
    memo: transaction.memo || transaction.merchant,
    confidence: Math.max(transaction.confidence, 0.9),
  } satisfies QuickTransactionInput;
}

export function findMissingColumn(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return null;
  }

  const message = String(error.message);
  return message.match(/Could not find the '([^']+)' column/)?.[1] ?? null;
}

export function formatSavedTransactionsMessage(items: QuickTransactionInput[]) {
  return `저장됨: ${items
    .map(
      (transaction) =>
        `${transaction.merchant} ${moneyFormatter.format(transaction.amount)}원`,
    )
    .join(", ")}`;
}

export function formatAiFallbackMessage(items: QuickTransactionInput[]) {
  return `AI 보정에 실패해 로컬 후보를 저장했습니다: ${items
    .map(
      (transaction) =>
        `${transaction.merchant} ${moneyFormatter.format(transaction.amount)}원`,
    )
    .join(", ")}`;
}

export function getTransactionTotals(transactions: TransactionPreview[]) {
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return { expenseTotal, incomeTotal };
}

export function getCategorySpendingAnalysis(
  transactions: TransactionPreview[],
  categoryLimit = 5,
) {
  const categoryTotals = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        Number.isFinite(transaction.amount) &&
        transaction.amount > 0,
    )
    .reduce<Map<string, number>>((totals, transaction) => {
      const category = transaction.category.trim() || "기타";
      totals.set(category, (totals.get(category) ?? 0) + transaction.amount);

      return totals;
    }, new Map());

  const sortedCategories = [...categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const total = sortedCategories.reduce((sum, item) => sum + item.amount, 0);
  const topCategories = sortedCategories.slice(0, categoryLimit);
  const otherTotal = sortedCategories
    .slice(categoryLimit)
    .reduce((sum, item) => sum + item.amount, 0);
  const visibleCategories =
    otherTotal > 0
      ? [...topCategories, { category: "기타", amount: otherTotal }]
      : topCategories;
  const categories = visibleCategories.map<CategorySpending>((item) => ({
    ...item,
    ratio: total > 0 ? item.amount / total : 0,
  }));

  return {
    total,
    categories,
  };
}
