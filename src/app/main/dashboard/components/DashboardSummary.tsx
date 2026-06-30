import { moneyFormatter } from "../utils";
import styles from "../dashboard.module.scss";

type DashboardSummaryProps = {
  expenseTotal: number;
  incomeTotal: number;
};

export function DashboardSummary({
  expenseTotal,
  incomeTotal,
}: DashboardSummaryProps) {
  return (
    <section className={styles.summary}>
      <div>
        <p className={styles.eyebrow}>이번 달 흐름</p>
        <h1>결제 문자와 빠른 입력을 거래로 정리합니다</h1>
        <p className={styles.description}>
          카드 승인 문자나 “스벅 5000” 같은 빠른 입력을 한 칸에 붙여넣고
          분석된 거래만 확인한 뒤 저장합니다.
        </p>
      </div>

      <div className={styles.totalGrid}>
        <div className={styles.totalItem}>
          <span>지출</span>
          <strong>{moneyFormatter.format(expenseTotal)}원</strong>
        </div>
        <div className={styles.totalItem}>
          <span>수입</span>
          <strong>{moneyFormatter.format(incomeTotal)}원</strong>
        </div>
        <div className={styles.totalItem}>
          <span>잔액 영향</span>
          <strong>{moneyFormatter.format(incomeTotal - expenseTotal)}원</strong>
        </div>
      </div>
    </section>
  );
}
