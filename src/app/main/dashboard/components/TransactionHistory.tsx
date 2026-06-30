import type { TransactionPreview } from "../types";
import { formatTransactionDateTime, moneyFormatter } from "../utils";
import styles from "../dashboard.module.scss";

const RECENT_TRANSACTION_LIMIT = 5;

type TransactionHistoryProps = {
  transactions: TransactionPreview[];
  isLoadingTransactions: boolean;
};

export function TransactionHistory({
  transactions,
  isLoadingTransactions,
}: TransactionHistoryProps) {
  const recentTransactions = transactions.slice(0, RECENT_TRANSACTION_LIMIT);

  return (
    <section className={styles.history}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>최근 거래</p>
          <h2>입력된 거래내역</h2>
        </div>
      </div>

      {isLoadingTransactions ? (
        <div className={styles.emptyList}>거래내역을 불러오는 중입니다.</div>
      ) : transactions.length === 0 ? (
        <div className={styles.emptyList}>
          아직 저장된 거래내역이 없습니다. 결제 문자나 빠른 입력을 분석해
          저장하면 여기에 표시됩니다.
        </div>
      ) : (
        <div className={styles.transactionList}>
          {recentTransactions.map((transaction) => (
            <article className={styles.transactionItem} key={transaction.id}>
              <div>
                <strong>{transaction.title}</strong>
                <span>
                  {transaction.merchant} · {transaction.category} ·{" "}
                  {formatTransactionDateTime(transaction.paidAt)}
                </span>
              </div>
              <div className={styles.amountGroup}>
                <strong
                  className={
                    transaction.type === "income" ? styles.income : styles.expense
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {moneyFormatter.format(transaction.amount)}원
                </strong>
                <span>
                  {transaction.source === "sms"
                    ? "문자"
                    : transaction.source === "manual"
                      ? "직접"
                      : "DB"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
