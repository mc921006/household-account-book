import "server-only";

import type { AIProvider } from "@/lib/ai/types";
import {
  applyLocalTransactionRule,
  normalizeCategory,
  type QuickTransactionAnalysis,
  type QuickTransactionInput,
} from "@/lib/transactions/analyzer";

type OpenRouterChatResponse = {
  choices?: Array<{
    text?: string;
    finish_reason?: string;
    native_finish_reason?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    delta?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";
const DEFAULT_QUICK_TIMEOUT_MS = 30000;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterCompletionParams = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
  maxTokens: number;
};

async function requestOpenRouterCompletion({
  apiKey,
  model,
  timeoutMs,
  messages,
  maxTokens,
}: OpenRouterCompletionParams) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Household Account Book",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        max_tokens: maxTokens,
      }),
    });
    const data = (await response.json()) as OpenRouterChatResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ?? "OpenRouter 분석 요청에 실패했습니다.",
      );
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

function createQuickPrompt(input: QuickTransactionInput[]) {
  return [
    "한국 가계부 거래 후보를 분석한다.",
    "반드시 JSON 객체만 반환한다.",
    "transactions 길이와 순서는 입력과 동일해야 한다.",
    "amount, rawText는 입력값 그대로 유지한다.",
    "category는 카페, 식비, 교통, 생활, 쇼핑, 콘텐츠, 구독, 의료, 수입, 기타 중 하나만 사용한다.",
    "",
    "분류 기준:",
    "- 음식점/메뉴명: 우동, 국밥, 김밥, 라멘, 돈까스, 떡볶이, 치킨, 피자, 초밥, 고기, 족발, 보쌈, 분식, 식당, 포차, 주점, 햄버거 => 식비",
    "- 카페/디저트: 커피, 카페, 디저트, 베이커리, 빵집, 케이크, 아이스크림, 도넛 => 카페",
    "- 교통: 지하철, 전철, 버스, 택시, 기차, KTX, SRT, 주차, 하이패스 => 교통",
    "- 생활: 편의점, 마트, 슈퍼, 다이소, 올리브영, 약국, 세탁, 미용실, 네일 => 생활",
    "- 쇼핑: 의류, 패션, 신발, 쇼핑몰, 백화점, 아울렛, 온라인몰, 스토어, 마켓 => 쇼핑",
    "- 콘텐츠: 영화, 게임, 앱결제, 앱스토어, 플레이스토어, 음악, OTT, 웹툰, 도서 => 콘텐츠",
    "- 구독: 정기결제, 월정액, 멤버십, 구독, 자동결제 => 구독",
    "- 의료: 병원, 의원, 치과, 한의원, 내과, 피부과, 안과, 동물병원 => 의료",
    "- 수입: 급여, 월급, 입금, 환급, 이자 => 수입",
    "- 확신 없거나 너무 짧고 애매하면 기타",
    "",
    "출력 형식:",
    '{"transactions":[{"merchant":"가맹점명","amount":1000,"category":"식비","date":"","memo":"","type":"expense","confidence":0.8,"rawText":"원문"}]}',
    "",
    "입력:",
    JSON.stringify(input),
  ].join("\n");
}

function parseQuickJson(text: string) {
  const repairAttempts = [
    text,
    text.replace(/}\s*{/g, "},{"),
    text.replace(/,\s*([}\]])/g, "$1"),
    text.replace(/}\s*{/g, "},{").replace(/,\s*([}\]])/g, "$1"),
  ];
  let lastError: unknown;

  for (const candidate of repairAttempts) {
    try {
      return JSON.parse(candidate) as Partial<QuickTransactionAnalysis>;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenRouter JSON 응답을 파싱하지 못했습니다.");
}

function extractQuickJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("OpenRouter 응답에서 JSON 객체를 찾지 못했습니다.");
  }

  return parseQuickJson(text.slice(start, end + 1));
}

function extractMessageContent(data: OpenRouterChatResponse) {
  const choice = data.choices?.[0];
  const content = choice?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return (choice?.text ?? choice?.delta?.content ?? "").trim();
}

function normalizeQuickDraft(
  value: Partial<QuickTransactionInput>,
  fallback: QuickTransactionInput,
) {
  const category = normalizeCategory(value.category, fallback.category);

  return {
    merchant: value.merchant?.trim() || fallback.merchant,
    amount: fallback.amount,
    category,
    date: fallback.date,
    memo: value.memo?.trim() || fallback.memo,
    type: fallback.type,
    confidence: fallback.confidence,
    rawText: fallback.rawText,
  } satisfies QuickTransactionInput;
}

function normalizeQuickAnalysis(
  value: Partial<QuickTransactionAnalysis>,
  fallback: QuickTransactionInput[],
) {
  const values = Array.isArray(value.transactions) ? value.transactions : [];

  return {
    transactions: fallback.map((transaction, index) =>
      normalizeQuickDraft(values[index] ?? {}, transaction),
    ),
  } satisfies QuickTransactionAnalysis;
}

export const openRouterAIProvider: AIProvider = {
  name: "openrouter",
  async refineQuickTransactions(input) {
    const localTransactions = input.map(applyLocalTransactionRule);
    const aiTargets: QuickTransactionInput[] = [];
    const aiTargetIndexes: number[] = [];

    localTransactions.forEach((transaction, index) => {
      if (transaction.category === "기타") {
        aiTargets.push(transaction);
        aiTargetIndexes.push(index);
      }
    });

    if (aiTargets.length === 0) {
      return { transactions: localTransactions };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.warn(
        "OPENROUTER_API_KEY is missing. Returning local candidates.",
      );
      return {
        transactions: localTransactions,
        error: "OPENROUTER_API_KEY가 없어 AI 보정을 건너뛰었습니다.",
      };
    }

    const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
    const timeoutMs = Number(
      process.env.OPENROUTER_QUICK_TIMEOUT_MS ??
        process.env.OPENROUTER_TIMEOUT_MS ??
        DEFAULT_QUICK_TIMEOUT_MS,
    );
    let data: OpenRouterChatResponse;

    try {
      data = await requestOpenRouterCompletion({
        apiKey,
        model,
        timeoutMs,
        messages: [
          {
            role: "system",
            content:
              "너는 한국 가계부 앱의 거래 목록 분석기다. 설명 없이 유효한 JSON만 반환한다.",
          },
          {
            role: "user",
            content: createQuickPrompt(aiTargets),
          },
        ],
        maxTokens: 700,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("OpenRouter quick transaction request timed out.", {
          model,
          timeoutMs,
        });
        return {
          transactions: localTransactions,
          error: `OpenRouter 요청이 ${timeoutMs}ms 안에 끝나지 않아 로컬 후보를 사용했습니다.`,
        };
      }

      console.warn(
        "OpenRouter quick transaction request failed. Returning local candidates.",
        error instanceof Error ? error.message : "unknown error",
      );
      return {
        transactions: localTransactions,
        error:
          error instanceof Error
            ? error.message
            : "OpenRouter 요청에 실패해 로컬 후보를 사용했습니다.",
      };
    }

    const content = extractMessageContent(data);

    if (!content) {
      console.warn(
        "OpenRouter returned an empty quick transaction completion.",
        {
          model,
          finishReason: data.choices?.[0]?.finish_reason,
          nativeFinishReason: data.choices?.[0]?.native_finish_reason,
        },
      );
      return {
        transactions: localTransactions,
        error: "OpenRouter가 빈 응답을 반환해 로컬 후보를 사용했습니다.",
      };
    }

    try {
      const aiAnalysis = normalizeQuickAnalysis(
        extractQuickJsonObject(content),
        aiTargets,
      );
      const transactions = [...localTransactions];

      aiTargetIndexes.forEach((originalIndex, resultIndex) => {
        transactions[originalIndex] =
          aiAnalysis.transactions[resultIndex] ?? transactions[originalIndex];
      });

      return { transactions };
    } catch (error) {
      console.warn(
        "OpenRouter returned a non-JSON quick transaction completion.",
        {
          model,
          error: error instanceof Error ? error.message : "unknown error",
        },
      );
      return {
        transactions: localTransactions,
        error:
          error instanceof Error
            ? error.message
            : "OpenRouter JSON 응답을 파싱하지 못해 로컬 후보를 사용했습니다.",
      };
    }
  },
};
