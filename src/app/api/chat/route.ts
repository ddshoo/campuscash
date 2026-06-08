import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import type { Transaction } from "@/types";

type FinancialContext = {
  balance: number;
  threshold: number;
  creditScore: number;
  transactions: Transaction[];
};

function buildSystemPrompt(ctx: FinancialContext): string {
  const formatted = ctx.transactions.map((t) => {
    const sign = t.amount > 0 ? "+" : "";
    const date = new Date(t.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `  • ${date}  ${t.description} (${t.category})  ${sign}$${Math.abs(t.amount).toFixed(2)}`;
  });

  return `You are CampusCash, a friendly and knowledgeable personal finance assistant built for college students. You have access to this student's real financial data and must only cite figures that appear below — never invent numbers.

STUDENT FINANCIAL SNAPSHOT
───────────────────────────
Checking balance:    $${ctx.balance.toFixed(2)}
Low-balance alert:   $${ctx.threshold.toFixed(2)}
Credit score:        ${ctx.creditScore} (FICO)

RECENT TRANSACTIONS (last 5)
${formatted.join("\n")}

GUIDELINES
- Be concise, specific, and encouraging. You are talking to a college student, not a financial advisor's client.
- Always ground advice in the numbers above. If asked about their balance, quote $${ctx.balance.toFixed(2)}.
- If asked something you cannot answer from the data above (e.g., investment advice beyond their data), say so honestly.
- Never make up transaction details, balances, or scores not shown above.
- Keep responses to 3–5 sentences unless a longer explanation is genuinely needed.
- Do not use excessive financial jargon.`;
}

export async function POST(req: Request) {
  const { messages, financialContext } = await req.json() as {
    messages: UIMessage[];
    financialContext: FinancialContext;
  };

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: buildSystemPrompt(financialContext),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
