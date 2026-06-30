"use client";

import { useMemo, useState } from "react";
import { useDashboardTransactions } from "../dashboard/hooks/useDashboardTransactions";
import {
  filterTransactionsByMonth,
  formatMonthLabel,
  formatTransactionDateTime,
  getCurrentMonthValue,
  moneyFormatter,
} from "../dashboard/utils";
import styles from "../dashboard/dashboard.module.scss";

const TRANSACTION_PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { transactions, isLoadingTransactions } = useDashboardTransactions();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() =>
    Number(getCurrentMonthValue().split("-")[0]),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const monthlyTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedMonth),
    [selectedMonth, transactions],
  );
  const monthlyExpenseTotal = useMemo(
    () =>
      monthlyTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0),
    [monthlyTransactions],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(monthlyTransactions.length / TRANSACTION_PAGE_SIZE),
  );
  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * TRANSACTION_PAGE_SIZE;

    return monthlyTransactions.slice(start, start + TRANSACTION_PAGE_SIZE);
  }, [currentPage, monthlyTransactions]);

  const changeSelectedMonth = (value: string) => {
    setSelectedMonth(value);
    setPickerYear(Number(value.split("-")[0]));
    setIsMonthPickerOpen(false);
    setCurrentPage(1);
  };
  const selectMonth = (month: number) => {
    changeSelectedMonth(`${pickerYear}-${String(month).padStart(2, "0")}`);
  };

  return (
    <div className={styles.dashboard}>
      <section className={styles.history}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>거래내역</p>
            <h2>전체 거래내역</h2>
          </div>
          <div className={styles.monthControlGroup}>
            <button
              type="button"
              className={styles.monthPickerButton}
              onClick={() => setIsMonthPickerOpen((isOpen) => !isOpen)}
            >
              {formatMonthLabel(selectedMonth)}
            </button>
            {isMonthPickerOpen ? (
              <div className={styles.monthPicker}>
                <div className={styles.monthPickerHeader}>
                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year - 1)}
                    aria-label="이전 연도"
                  >
                    ‹
                  </button>
                  <strong>{pickerYear}</strong>
                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year + 1)}
                    aria-label="다음 연도"
                  >
                    ›
                  </button>
                </div>
                <div className={styles.monthGrid}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (month) => {
                      const monthValue = `${pickerYear}-${String(
                        month,
                      ).padStart(2, "0")}`;

                      return (
                        <button
                          type="button"
                          className={
                            selectedMonth === monthValue ? styles.activeMonth : ""
                          }
                          onClick={() => selectMonth(month)}
                          key={month}
                        >
                          {month}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {isLoadingTransactions ? (
          <div className={styles.emptyList}>거래내역을 불러오는 중입니다.</div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyList}>
            아직 저장된 거래내역이 없습니다. 결제 문자나 빠른 입력을 분석해
            저장하면 여기에 표시됩니다.
          </div>
        ) : monthlyTransactions.length === 0 ? (
          <div className={styles.emptyList}>
            {formatMonthLabel(selectedMonth)}에 저장된 거래내역이 없습니다.
          </div>
        ) : (
          <>
            <div className={styles.monthlyTotalBox}>
              <span>{formatMonthLabel(selectedMonth)} 총 지출</span>
              <strong>{moneyFormatter.format(monthlyExpenseTotal)}원</strong>
            </div>
            <div className={styles.transactionTableWrap}>
              <table className={styles.transactionTable}>
                <thead>
                  <tr>
                    <th>거래명</th>
                    <th>가맹점</th>
                    <th>카테고리</th>
                    <th>구분</th>
                    <th>금액</th>
                    <th>날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
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
                      <td>{formatTransactionDateTime(transaction.paidAt)}</td>
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
