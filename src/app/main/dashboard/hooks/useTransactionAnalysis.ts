import type { QuickTransactionInput } from "@/lib/transactions/analyzer";
import { parseTransactionInputDetails } from "@/lib/transactions/analyzer";
import { useRef, useState } from "react";
import { refineTransactionsWithAI } from "../services";
import type { MerchantCategoryMapping } from "../types";
import {
  applySavedMerchantMapping,
  formatAiFallbackMessage,
} from "../utils";

type UseTransactionAnalysisParams = {
  merchantCategoryMap: Map<string, MerchantCategoryMapping>;
  persistTransactions(items: QuickTransactionInput[]): Promise<string | null>;
};

export function useTransactionAnalysis({
  merchantCategoryMap,
  persistTransactions,
}: UseTransactionAnalysisParams) {
  const [analyzedTransactions, setAnalyzedTransactions] = useState<
    QuickTransactionInput[]
  >([]);
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSlowAnalysis, setIsSlowAnalysis] = useState(false);
  const analysisRequestIdRef = useRef(0);

  const resetAnalysis = () => {
    setMessageText("");
    setAnalyzedTransactions([]);
    setStatusMessage("");
  };

  const analyzeMessage = async () => {
    const trimmedMessage = messageText.trim();
    const { transactions: localTransactions, invalidLines } =
      parseTransactionInputDetails(trimmedMessage);

    if (localTransactions.length === 0) {
      setAnalyzedTransactions([]);
      setStatusMessage(
        "입력 방식이 잘못됐습니다. 예: 메가커피 4500 또는 결제 문자 원문을 입력해주세요.",
      );
      alert("분석할 결제 문자나 빠른 입력을 입력해주세요.");
      return;
    }

    if (invalidLines.length > 0) {
      setAnalyzedTransactions([]);
      setStatusMessage(
        `입력 방식이 잘못된 줄이 있습니다: ${invalidLines
          .slice(0, 3)
          .join(", ")}. 예: 메가커피 4500`,
      );
      return;
    }

    const requestId = analysisRequestIdRef.current + 1;
    analysisRequestIdRef.current = requestId;
    setAnalyzedTransactions([]);
    setIsAnalyzing(true);
    setIsSlowAnalysis(false);
    setStatusMessage(
      "금액과 대표 키워드는 로컬에서 처리하고, 필요한 항목만 AI로 보정하는 중입니다.",
    );

    const slowTimerId = window.setTimeout(() => {
      if (analysisRequestIdRef.current === requestId) {
        setIsSlowAnalysis(true);
        setStatusMessage(
          "조금 오래 걸리고 있어요. 매핑된 항목은 로컬에서 바로 처리합니다.",
        );
      }
    }, 5000);

    try {
      const refinedTransactions = [...localTransactions];
      const aiTargets: QuickTransactionInput[] = [];
      const aiTargetIndexes: number[] = [];
      let aiErrorMessage = "";

      localTransactions.forEach((transaction, index) => {
        if (transaction.category !== "기타") {
          return;
        }

        const mapped = applySavedMerchantMapping(
          transaction,
          merchantCategoryMap,
        );

        if (mapped) {
          refinedTransactions[index] = mapped;
          return;
        }

        aiTargets.push(transaction);
        aiTargetIndexes.push(index);
      });

      if (aiTargets.length > 0) {
        try {
          const aiResult = await refineTransactionsWithAI(aiTargets);

          aiTargetIndexes.forEach((originalIndex, resultIndex) => {
            refinedTransactions[originalIndex] =
              aiResult.transactions[resultIndex] ?? refinedTransactions[originalIndex];
          });

          if (aiResult.error) {
            aiErrorMessage = aiResult.error;
            setStatusMessage(`AI 보정에 실패해 로컬 후보를 저장합니다: ${aiResult.error}`);
          }
        } catch (error) {
          console.warn("AI 보정에 실패해 로컬 후보를 표시합니다.", error);
          aiErrorMessage =
            error instanceof Error ? error.message : "AI 보정에 실패했습니다.";
          setStatusMessage("AI 보정에 실패해 로컬 후보를 저장합니다.");
        }
      }

      if (analysisRequestIdRef.current !== requestId) {
        return;
      }

      setAnalyzedTransactions(refinedTransactions);
      const savedMessage = await persistTransactions(refinedTransactions);

      if (aiErrorMessage) {
        setStatusMessage(formatAiFallbackMessage(refinedTransactions));
      } else if (savedMessage) {
        setMessageText("");
        setStatusMessage(savedMessage);
      }
    } finally {
      window.clearTimeout(slowTimerId);

      if (analysisRequestIdRef.current === requestId) {
        setIsAnalyzing(false);
        setIsSlowAnalysis(false);
      }
    }
  };

  return {
    analyzedTransactions,
    messageText,
    setMessageText,
    statusMessage,
    isAnalyzing,
    isSlowAnalysis,
    analyzeMessage,
    resetAnalysis,
  };
}
