import type { CSSProperties } from "react";
import type { CategorySpending, TransactionPreview } from "../types";
import {
  getCategorySpendingAnalysis,
  moneyFormatter,
} from "../utils";
import styles from "../dashboard.module.scss";

const CATEGORY_COLORS = [
  "#1f6f55",
  "#d18f2f",
  "#4f6f9f",
  "#b5473f",
  "#6f5aa8",
  "#7a8794",
];

type CategorySpendingAnalysisProps = {
  transactions: TransactionPreview[];
  isLoadingTransactions: boolean;
};

type AiConsumptionInsight = {
  summary: string;
  topField: string;
  habit: string;
  savingPoint: string;
};

function buildDonutGradient(categories: CategorySpending[]) {
  let cursor = 0;
  const segments = categories.map((category, index) => {
    const start = cursor;
    const end = cursor + category.ratio * 100;
    cursor = end;

    return `${CATEGORY_COLORS[index]} ${start}% ${end}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function getCategoryTone(category: string) {
  if (category.includes("식비")) {
    return {
      field: "식비",
      behavior: "외식이나 식사 관련 결제가 생활비의 중심을 차지하고 있습니다.",
      saving:
        "외식 횟수나 배달 빈도를 조금만 조정해도 전체 지출을 크게 줄일 수 있습니다.",
    };
  }

  if (category.includes("카페")) {
    return {
      field: "커피/카페",
      behavior: "소액 결제가 반복되며 체감보다 큰 지출로 쌓이는 패턴입니다.",
      saving:
        "평일 카페 이용 횟수를 정해두면 부담 없이 누수를 줄일 수 있습니다.",
    };
  }

  if (category.includes("쇼핑")) {
    return {
      field: "쇼핑",
      behavior: "비정기 소비가 상위 지출로 올라와 충동 구매 가능성을 확인해볼 만합니다.",
      saving:
        "구매 전 하루 정도 보류하는 규칙을 두면 불필요한 지출을 걸러낼 수 있습니다.",
    };
  }

  if (category.includes("교통")) {
    return {
      field: "교통",
      behavior: "이동 관련 지출이 고정비처럼 꾸준히 발생하고 있습니다.",
      saving:
        "정기권이나 대체 이동수단을 비교하면 반복 비용을 낮출 여지가 있습니다.",
    };
  }

  if (category.includes("구독") || category.includes("콘텐츠")) {
    return {
      field: category,
      behavior: "자동 결제성 지출이 누적되어 월 지출 비중을 만들고 있습니다.",
      saving:
        "사용 빈도가 낮은 구독을 정리하면 바로 절약 효과를 볼 수 있습니다.",
    };
  }

  return {
    field: category,
    behavior: `${category} 지출이 이번 달 소비 흐름에서 가장 크게 나타납니다.`,
    saving:
      "상위 지출 내역을 한 번 더 확인하면 줄이기 쉬운 반복 소비를 찾을 수 있습니다.",
  };
}

function createAiInsight(categories: CategorySpending[]): AiConsumptionInsight {
  if (categories.length === 0) {
    return {
      summary:
        "아직 분석할 소비 데이터가 없습니다. 거래를 저장하면 이번 달 소비 비중과 반복 지출 흐름을 요약해드립니다.",
      topField: "가장 많이 소비한 분야는 아직 확인되지 않았습니다.",
      habit: "소비 습관 인사이트는 지출 거래가 쌓이면 더 정확해집니다.",
      savingPoint: "절약 포인트는 카테고리별 지출이 생긴 뒤 표시됩니다.",
    };
  }

  const topCategory = categories[0];
  const secondCategory = categories[1];
  const ratio = Math.round(topCategory.ratio * 100);
  const tone = getCategoryTone(topCategory.category);
  const concentration =
    ratio >= 40
      ? "집중되어 있습니다"
      : ratio >= 25
        ? "큰 비중을 차지하고 있습니다"
        : "가장 큰 항목으로 나타납니다";
  const secondaryContext = secondCategory
    ? ` 다음으로는 ${secondCategory.category} 지출이 이어져 두 항목이 소비 흐름을 주도합니다.`
    : " 특정 한 분야에 소비가 모여 있는 형태입니다.";

  return {
    summary: `이번 달 소비의 ${ratio}%가 ${tone.field}에 ${concentration}.${secondaryContext}`,
    topField: `가장 많이 소비한 분야는 ${tone.field}이며, ${moneyFormatter.format(
      topCategory.amount,
    )}원이 사용되었습니다.`,
    habit: tone.behavior,
    savingPoint:
      ratio >= 25
        ? tone.saving
        : "현재는 특정 항목 쏠림이 크지 않아, 작은 반복 지출부터 점검하는 편이 좋습니다.",
  };
}

function createInsightItems(insight: AiConsumptionInsight) {
  return [
    ["소비 패턴 요약", insight.summary],
    ["가장 많이 소비한 분야", insight.topField],
    ["한 줄 인사이트", insight.habit],
    ["절약 포인트", insight.savingPoint],
  ] as const;
}

export function CategorySpendingAnalysis({
  transactions,
  isLoadingTransactions,
}: CategorySpendingAnalysisProps) {
  const { total, categories } = getCategorySpendingAnalysis(transactions);
  const donutStyle =
    categories.length > 0
      ? ({ background: buildDonutGradient(categories) } satisfies CSSProperties)
      : undefined;
  const insight = createAiInsight(categories);
  const insightItems = createInsightItems(insight);

  return (
    <section className={styles.categoryAnalysis}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>소비 분석</p>
          <h2>카테고리별 지출</h2>
        </div>
        <strong className={styles.analysisTotal}>
          {moneyFormatter.format(total)}원
        </strong>
      </div>

      {isLoadingTransactions ? (
        <div className={styles.emptyList}>소비 분석을 불러오는 중입니다.</div>
      ) : categories.length === 0 ? (
        <div className={styles.emptyList}>
          아직 분석할 지출 거래가 없습니다. 거래를 저장하면 카테고리별 소비
          비중이 표시됩니다.
        </div>
      ) : (
        <div className={styles.categoryAnalysisGrid}>
          <div className={styles.donutPanel}>
            <div
              className={styles.donutChart}
              style={donutStyle}
              aria-label="카테고리별 소비 비중 도넛 차트"
            >
              <div>
                <span>총 지출</span>
                <strong>{moneyFormatter.format(total)}원</strong>
              </div>
            </div>

            <div className={styles.categoryLegend}>
              {categories.map((category, index) => (
                <div className={styles.legendItem} key={category.category}>
                  <span
                    className={styles.legendColor}
                    style={
                      {
                        "--legend-color": CATEGORY_COLORS[index],
                      } as CSSProperties
                    }
                  />
                  <div>
                    <strong>{category.category}</strong>
                    <span>{Math.round(category.ratio * 100)}%</span>
                  </div>
                  <em>{moneyFormatter.format(category.amount)}원</em>
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.aiInsightCard}>
            <div>
              <p className={styles.eyebrow}>AI 소비 분석</p>
              <h3>이번 달 소비 패턴</h3>
            </div>
            <div className={styles.insightList}>
              {insightItems.map(([label, text]) => (
                <div className={styles.insightItem} key={label}>
                  <span>{label}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
