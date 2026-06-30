"use client";

import { AnalysisReviewPanel } from "./components/AnalysisReviewPanel";
import { CategorySpendingAnalysis } from "./components/CategorySpendingAnalysis";
import { DashboardSummary } from "./components/DashboardSummary";
import { TransactionInputPanel } from "./components/TransactionInputPanel";
import { useDashboardTransactions } from "./hooks/useDashboardTransactions";
import { useTransactionAnalysis } from "./hooks/useTransactionAnalysis";
import styles from "./dashboard.module.scss";
import { getTransactionTotals } from "./utils";

export default function DashboardPage() {
  const {
    user,
    transactions,
    merchantCategoryMap,
    isSaving,
    isLoadingTransactions,
    persistTransactions,
  } = useDashboardTransactions();
  const {
    analyzedTransactions,
    messageText,
    setMessageText,
    statusMessage,
    isAnalyzing,
    isSlowAnalysis,
    analyzeMessage,
    resetAnalysis,
  } = useTransactionAnalysis({
    merchantCategoryMap,
    persistTransactions,
  });
  const { expenseTotal, incomeTotal } = getTransactionTotals(transactions);

  return (
    <div className={styles.dashboard}>
      <DashboardSummary expenseTotal={expenseTotal} incomeTotal={incomeTotal} />

      <section className={styles.workspace}>
        <TransactionInputPanel
          messageText={messageText}
          isAnalyzing={isAnalyzing}
          isSaving={isSaving}
          onMessageTextChange={setMessageText}
          onAnalyze={analyzeMessage}
          onReset={resetAnalysis}
        />

        <AnalysisReviewPanel
          user={user}
          statusMessage={statusMessage}
          isSlowAnalysis={isSlowAnalysis}
          analyzedTransactions={analyzedTransactions}
        />
      </section>

      <CategorySpendingAnalysis
        transactions={transactions}
        isLoadingTransactions={isLoadingTransactions}
      />
    </div>
  );
}
