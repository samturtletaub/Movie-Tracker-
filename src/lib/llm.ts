/**
 * Minimal LLM client. Supports Anthropic or OpenAI depending on which key is set.
 * Returns strict JSON so the recommender can parse.
 */

export interface LlmResult<T> {
  ok: true;
  data: T;
}
export interface LlmError {
  ok: false;
  error: string;
}

export async function llmJSON<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<LlmResult<T> | LlmError> {
  const anth = process.env.ANTHROPIC_API_KEY;
  const oai = process.env.OPENAI_API_KEY;
  if (anth) return await callAnthropic<T>(anth, systemPrompt, userPrompt);
  if (oai) return await callOpenAI<T>(oai, systemPrompt, userPrompt);
  return { ok: false, error: "No LLM API key set (ANTHROPIC_API_KEY or OPENAI_API_KEY)" };
}

async function callAnthropic<T>(
  key: string,
  system: string,
  user: string,
): Promise<LlmResult<T> | LlmError> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Anthropic ${res.status}: ${await res.text()}` };
    }
    const body = await res.json();
    const text = body?.content?.[0]?.text as string | undefined;
    if (!text) return { ok: false, error: "Anthropic: empty response" };
    const parsed = extractJson(text);
    if (!parsed) return { ok: false, error: "Anthropic: could not parse JSON" };
    return { ok: true, data: parsed as T };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function callOpenAI<T>(
  key: string,
  system: string,
  user: string,
): Promise<LlmResult<T> | LlmError> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `OpenAI ${res.status}: ${await res.text()}` };
    }
    const body = await res.json();
    const text = body?.choices?.[0]?.message?.content as string | undefined;
    if (!text) return { ok: false, error: "OpenAI: empty response" };
    const parsed = extractJson(text);
    if (!parsed) return { ok: false, error: "OpenAI: could not parse JSON" };
    return { ok: true, data: parsed as T };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function extractJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {}
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {}
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return null;
}
