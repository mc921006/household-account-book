export type TransactionType = "expense" | "income";

export type QuickTransactionInput = {
  merchant: string;
  amount: number;
  category: string;
  date?: string;
  memo?: string;
  type: TransactionType;
  confidence: number;
  rawText: string;
};

export type QuickTransactionAnalysis = {
  transactions: QuickTransactionInput[];
  error?: string;
};

export type TransactionParseResult = {
  transactions: QuickTransactionInput[];
  invalidLines: string[];
};

export const QUICK_CATEGORIES = [
  "카페",
  "식비",
  "교통",
  "생활",
  "쇼핑",
  "콘텐츠",
  "구독",
  "의료",
  "수입",
  "기타",
] as const;

export type QuickCategory = (typeof QUICK_CATEGORIES)[number];

function normalizeRuleText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isQuickCategory(value: string): value is QuickCategory {
  return QUICK_CATEGORIES.some((category) => category === value);
}

function createLocalQuickRule(merchant: string) {
  const normalized = normalizeRuleText(merchant);

  if (
    /스벅|스타벅스|메가커피|메가mgc|mgc커피|컴포즈|투썸|이디야/.test(normalized)
  ) {
    return {
      merchant: /스벅/.test(normalized) ? "스타벅스" : merchant.trim(),
      category: "카페",
    };
  }

  if (
    /맥도날드|프랭크버거|버거킹|노모어|롯데리아|kfc|서브웨이|배민|배달의민족|쿠팡이츠|요기요|우동|국밥|김밥|라멘|라면|돈까스|돈가스|떡볶이|순대|족발|보쌈|치킨|피자|초밥|스시|횟집|고깃집|갈비|삼겹살|반점|짬뽕|짜장|중식|분식|식당|포차|호프/.test(
      normalized,
    )
  ) {
    return {
      merchant: merchant.trim(),
      category: "식비",
    };
  }

  if (
    /(^|[^a-z0-9])cu([^a-z0-9]|$)|씨유|gs25|gs편의점|지에스25|세븐일레븐|이마트24|올리브영|다이소|이마트|홈플러스|롯데마트|노브랜드/.test(
      normalized,
    )
  ) {
    return {
      merchant: merchant.trim(),
      category: "생활",
    };
  }

  if (/전철|지하철|버스|택시/.test(normalized)) {
    return {
      merchant: /전\*?철|전철|지하철/.test(normalized)
        ? "전철"
        : merchant.trim(),
      category: "교통",
    };
  }

  if (
    /쿠팡|마켓컬리|컬리|11번가|g마켓|스파오|spao|무신사|지그재그|에이블리|kream/.test(
      normalized,
    )
  ) {
    return {
      merchant: merchant.trim(),
      category: "쇼핑",
    };
  }

  if (/넷플릭스|티빙|유튜브프리미엄|youtubepremium/.test(normalized)) {
    return {
      merchant: merchant.trim(),
      category: "구독",
    };
  }

  if (
    /구글플레이|구글페이먼트|구글페이|googleplay|googlepayment/.test(normalized)
  ) {
    return {
      merchant: "구글플레이",
      category: "콘텐츠",
    };
  }

  if (/메가박스|cgv|롯데시네마|왓챠/.test(normalized)) {
    return {
      merchant: merchant.trim(),
      category: "콘텐츠",
    };
  }

  if (/병원|의원|치과|약국|내과|피부과|안과/.test(normalized)) {
    return {
      merchant: merchant.trim(),
      category: "의료",
    };
  }

  return null;
}

export function normalizeCategory(
  category: string | undefined,
  fallback = "기타",
): QuickCategory {
  const value = category?.trim() ?? "";

  if (isQuickCategory(value)) {
    return value;
  }

  const normalized = normalizeRuleText(value);

  if (/커피|coffee|cafe|카페|디저트|베이커리/.test(normalized)) {
    return "카페";
  }

  if (
    /패스트푸드|음식|외식|버거|식사|식당|분식|치킨|피자|배달|food|restaurant/.test(
      normalized,
    )
  ) {
    return "식비";
  }

  if (
    /대중교통|교통|지하철|전철|버스|택시|transport|transit/.test(normalized)
  ) {
    return "교통";
  }

  if (/편의점|생활|마트|잡화|약국|daily|convenience/.test(normalized)) {
    return "생활";
  }

  if (/쇼핑|구매|온라인쇼핑|shopping|ecommerce/.test(normalized)) {
    return "쇼핑";
  }

  if (/콘텐츠|게임|앱|영화|음악|content|game|app/.test(normalized)) {
    return "콘텐츠";
  }

  if (/구독|정기결제|subscription|subscribe/.test(normalized)) {
    return "구독";
  }

  if (/의료|병원|의원|치과|약|medical|hospital|clinic/.test(normalized)) {
    return "의료";
  }

  if (/수입|입금|급여|월급|income|salary/.test(normalized)) {
    return "수입";
  }

  return isQuickCategory(fallback) ? fallback : "기타";
}

export function applyLocalTransactionRule(
  transaction: QuickTransactionInput,
): QuickTransactionInput {
  const localRule = createLocalQuickRule(
    `${transaction.merchant} ${transaction.memo ?? ""} ${transaction.rawText}`,
  );
  const fallbackCategory = transaction.type === "income" ? "수입" : "기타";

  if (!localRule) {
    return {
      ...transaction,
      category: normalizeCategory(transaction.category, fallbackCategory),
    };
  }

  return {
    ...transaction,
    merchant: localRule.merchant,
    category: localRule.category,
    memo: transaction.memo || transaction.merchant,
    confidence: Math.max(transaction.confidence, 0.9),
  };
}

export function parseQuickTransactionInput(
  input: string,
): QuickTransactionInput | null {
  const match = input.trim().match(/^(.+?)\s*(\d[\d,]*)\s*원?$/);

  if (!match) {
    return null;
  }

  const [, rawMerchant, rawAmount] = match;
  const merchant = rawMerchant.trim();
  const amount = Number(rawAmount.replaceAll(",", ""));

  if (
    !merchant ||
    !/[^\d,\s원]/.test(merchant) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }
  const localRule = createLocalQuickRule(merchant);

  return {
    merchant: localRule?.merchant ?? merchant,
    amount,
    category: normalizeCategory(localRule?.category, "기타"),
    memo: merchant,
    type: "expense",
    confidence: localRule ? 0.9 : 0.35,
    rawText: input.trim(),
  };
}

function parseMultipleQuickTransactionInputs(input: string) {
  const matches = [...input.matchAll(/(\d[\d,]*)\s*원?/g)];

  if (matches.length <= 1) {
    return null;
  }

  const transactions: QuickTransactionInput[] = [];
  let merchantStart = 0;

  for (const match of matches) {
    const amountStart = match.index ?? 0;
    const nextMerchantStart = amountStart + match[0].length;
    const merchant = input.slice(merchantStart, amountStart).trim();
    const transaction = parseQuickTransactionInput(
      `${merchant} ${match[1]}원`,
    );

    if (!transaction) {
      return null;
    }

    transactions.push(transaction);
    merchantStart = nextMerchantStart;
  }

  if (input.slice(merchantStart).trim()) {
    return null;
  }

  return transactions;
}

function createQuickTransactionFromParts(
  merchant: string,
  amount: number,
  memo: string,
): QuickTransactionInput | null {
  const trimmedMerchant = merchant.trim();

  if (
    !trimmedMerchant ||
    !/[^\d,\s원]/.test(trimmedMerchant) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }
  const localRule = createLocalQuickRule(`${trimmedMerchant} ${memo}`);

  return {
    merchant: localRule?.merchant ?? trimmedMerchant,
    amount,
    category: normalizeCategory(localRule?.category, "기타"),
    memo: memo.trim() || trimmedMerchant,
    type: "expense",
    confidence: localRule ? 0.9 : 0.35,
    rawText: memo.trim() || trimmedMerchant,
  };
}

function parseDateLineMerchant(line: string) {
  const match = line.match(/\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{2}\s+(.+)/);
  return match?.[1]?.trim() ?? "";
}

function cleanMerchantCandidate(line: string) {
  return line
    .replace(/\[?web발신\]?/gi, "")
    .replace(/\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{2}/g, "")
    .replace(/[\d,]+\s*원.*/g, "")
    .replace(/.*승인\s*/g, "")
    .replace(/일시불|취소|잔액|누적|카드|은행|삼성\d*/g, "")
    .trim();
}

function isNonTransactionText(line: string) {
  return /누적|잔액|채널\s*추가|마케팅|광고|혜택|이벤트/i.test(line);
}

export function parseTransactionInputDetails(input: string): TransactionParseResult {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const transactions: QuickTransactionInput[] = [];
  const invalidLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isNonTransactionText(line)) {
      continue;
    }

    const quickTransactions = parseMultipleQuickTransactionInputs(line);

    if (quickTransactions) {
      transactions.push(...quickTransactions);
      continue;
    }

    const quickTransaction = parseQuickTransactionInput(line);

    if (quickTransaction) {
      transactions.push(quickTransaction);
      continue;
    }

    const amountMatch = line.match(/([\d,]+)\s*원/);

    if (!amountMatch || isNonTransactionText(line)) {
      invalidLines.push(line);
      continue;
    }

    const amount = Number(amountMatch[1].replaceAll(",", ""));
    const currentMerchant = cleanMerchantCandidate(
      line.slice(0, amountMatch.index),
    );
    const nextMerchant = parseDateLineMerchant(lines[index + 1] ?? "");
    const previousMerchant = cleanMerchantCandidate(lines[index - 1] ?? "");
    const merchant = nextMerchant || currentMerchant || previousMerchant;
    const rawLines = [lines[index - 1], line, lines[index + 1]].filter(
      (value): value is string =>
        Boolean(value) && !isNonTransactionText(value),
    );
    const memo = rawLines.join("\n");
    const transaction = createQuickTransactionFromParts(merchant, amount, memo);

    if (transaction) {
      transactions.push(transaction);
    } else {
      invalidLines.push(line);
    }
  }

  return { transactions, invalidLines };
}

export function parseTransactionInputs(input: string): QuickTransactionInput[] {
  return parseTransactionInputDetails(input).transactions;
}
