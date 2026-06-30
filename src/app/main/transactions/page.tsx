"use client";

import { useMemo, useState } from "react";
import { useDashboardTransactions } from "../dashboard/hooks/useDashboardTransactions";
import { formatTransactionDateTime, moneyFormatter } from "../dashboard/utils";
import styles from "../dashboard/dashboard.module.scss";

const TRANSACTION_PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { transactions, isLoadingTransactions } = useDashboardTransactions();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(transactions.length / TRANSACTION_PAGE_SIZE),
  );
  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * TRANSACTION_PAGE_SIZE;

    return transactions.slice(start, start + TRANSACTION_PAGE_SIZE);
  }, [currentPage, transactions]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.history}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>거래내역</p>
            <h2>전체 거래내역</h2>
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
          <>
            <div className={styles.transactionTableWrap}>
              <table className={styles.transactionTable}>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>거래명</th>
                    <th>가맹점</th>
                    <th>카테고리</th>
                    <th>구분</th>
                    <th>금액</th>
                    <th>출처</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatTransactionDateTime(transaction.paidAt)}</td>
                      <td>{transaction.title}</td>
                      <td>{transaction.merchant}</td>
                      <td>{transaction.category}</td>
                      <td>{transaction.type === "income" ? "수입" : "지출"}</td>
                      <td
                        className={
                          transaction.type === "income"
                            ? styles.income
                            : styles.expense
                        }
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {moneyFormatter.format(transaction.amount)}원
                      </td>
                      <td>
                        {transaction.source === "sms"
                          ? "문자"
                          : transaction.source === "manual"
                            ? "직접"
                            : "DB"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                이전
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
              >
                다음
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
