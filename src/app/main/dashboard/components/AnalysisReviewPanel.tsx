import type { QuickTransactionInput } from "@/lib/transactions/analyzer";
import type { LoginUser } from "../types";
import { moneyFormatter } from "../utils";
import styles from "../dashboard.module.scss";

type AnalysisReviewPanelProps = {
  user: LoginUser | null;
  statusMessage: string;
  isSlowAnalysis: boolean;
  analyzedTransactions: QuickTransactionInput[];
};

export function AnalysisReviewPanel({
  user,
  statusMessage,
  isSlowAnalysis,
  analyzedTransactions,
}: AnalysisReviewPanelProps) {
  return (
    <div className={styles.reviewPanel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>분석 결과</p>
          <h2>확인</h2>
        </div>
        <span className={styles.userBadge}>
          {user?.email ?? "로그인 확인 중"}
        </span>
      </div>

      {statusMessage ? (
        <div
          className={isSlowAnalysis ? styles.quickNotice : styles.analysisStatus}
        >
          {statusMessage}
        </div>
      ) : null}

      {analyzedTransactions.length === 0 ? (
        <div className={styles.emptyAnalysis}>
          저장하기를 누르면 금액은 로컬에서 추출하고, 가맹점명/메모와
          카테고리는 저장된 매핑 또는 AI로 정리해 저장한 결과를 여기에
          표시합니다.
        </div>
      ) : (
        <div className={styles.confirmList}>
          {analyzedTransactions.map((transaction, index) => (
            <article
              className={styles.confirmItem}
              key={`${transaction.rawText}-${transaction.amount}-${index}`}
            >
              <div>
                <span className={styles.category}>{transaction.category}</span>
                <h3>{transaction.merchant}</h3>
                <p>{transaction.memo || transaction.rawText}</p>
                <span className={styles.rawText}>{transaction.rawText}</span>
              </div>
              <strong
                className={
                  transaction.type === "income" ? styles.income : styles.expense
                }
              >
                {moneyFormatter.format(transaction.amount)}원
              </strong>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
