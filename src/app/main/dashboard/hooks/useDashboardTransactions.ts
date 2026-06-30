import type { QuickTransactionInput } from "@/lib/transactions/analyzer";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCurrentUser,
  fetchTransactionPreviews,
  insertTransactionsWithFallback,
} from "../services";
import type { LoginUser, TransactionPreview } from "../types";
import {
  createMerchantCategoryMap,
  formatSavedTransactionsMessage,
} from "../utils";

export function useDashboardTransactions() {
  const [user, setUser] = useState<LoginUser | null>(null);
  const [transactions, setTransactions] = useState<TransactionPreview[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const merchantCategoryMap = useMemo(
    () => createMerchantCategoryMap(transactions),
    [transactions],
  );

  const fetchTransactions = useCallback(async (userId: string) => {
    setIsLoadingTransactions(true);

    try {
      setTransactions(await fetchTransactionPreviews(userId));
    } catch (error) {
      console.error(error);
      alert("거래내역을 불러오지 못했습니다.");
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      const nextUser = await fetchCurrentUser();

      if (!nextUser) {
        setIsLoadingTransactions(false);
        return;
      }

      setUser(nextUser);
      await fetchTransactions(nextUser.id);
    };

    void loadInitialData();
  }, [fetchTransactions]);

  const persistTransactions = useCallback(
    async (items: QuickTransactionInput[]) => {
      if (!user) {
        alert("로그인이 필요합니다.");
        return null;
      }

      if (items.length === 0) {
        alert("저장할 분석 결과가 없습니다.");
        return null;
      }

      setIsSaving(true);

      try {
        const omittedColumns = await insertTransactionsWithFallback(user.id, items);

        if (omittedColumns.size > 0) {
          console.warn(
            `transactions 테이블에 없는 컬럼을 제외하고 저장했습니다: ${[
              ...omittedColumns,
            ].join(", ")}`,
          );
        }

        await fetchTransactions(user.id);
        return formatSavedTransactionsMessage(items);
      } catch (error) {
        console.error(error);
        alert("저장 실패");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchTransactions, user],
  );

  return {
    user,
    transactions,
    merchantCategoryMap,
    isSaving,
    isLoadingTransactions,
    persistTransactions,
  };
}
