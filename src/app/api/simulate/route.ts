import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

type SimulateRequest = {
  creditScore: number;
  userQuery: string;
};

type SimulateResult = {
  hypotheticalScore: number;
  delta: number;
  explanation: string;
};

const SYSTEM_PROMPT = `You are a credit scoring expert who models realistic FICO score changes for college students.

Given the student's current FICO score and a hypothetical financial action, return ONLY a JSON object with no markdown, no explanation outside the JSON, and no code fences. The JSON must have exactly these fields:
- hypotheticalScore: number (the new estimated score after the action, clamped between 300 and 850)
- delta: number (the change in points, positive or negative)
- explanation: string (exactly 2 sentences explaining why the score changes and what factor drives it)

Use realistic FICO modeling:
- Paying off a credit card balance: +15 to +40 points (reduces utilization, the biggest factor)
- Opening a new credit account: -5 to -15 points (hard inquiry + lower average age of accounts)
- Missing a payment: -60 to -110 points (payment history is 35% of FICO)
- Closing an old account: -5 to -25 points (increases utilization + shortens history)
- Becoming an authorized user on a good account: +10 to +30 points
- Paying down 50% of a loan: +10 to +25 points

Base the magnitude on the student's current score — lower scores see larger swings. Always keep hypotheticalScore between 300 and 850.`;

export async function POST(req: Request) {
  const { creditScore, userQuery } = (await req.json()) as SimulateRequest;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    system: SYSTEM_PROMPT,
    prompt: `Current FICO score: ${creditScore}\nScenario: ${userQuery}`,
  });

  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  const result = JSON.parse(cleaned) as SimulateResult;

  return Response.json(result);
}
