/**
 * OpenRouter AI Integration (Nemotron)
 *
 * Server-side only. This module MUST NOT be imported in client components.
 *
 * Responsibilities:
 *  1. Validate OpenRouter configuration from environment variables.
 *  2. Build the structured AI prompt from analysis context.
 *  3. Call the OpenRouter /api/v1/chat/completions API (OpenAI-compatible).
 *  4. Parse and validate the structured JSON response.
 *  5. Return a typed AIAnalysis result or throw a typed error.
 *
 * Environment variables required (server-side only — never expose to client):
 *   OPENROUTER_API_KEY   OpenRouter API key
 *   OPENROUTER_MODEL     model ID (default: nvidia/llama-3.1-nemotron-ultra-253b-v1:free)
 */

import type { AIContext } from "./build-analysis-context";

// ── Strict output type ────────────────────────────────────────────

export interface AIRecommendationResult {
  priority: number;             // 1 = highest
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  whyItMatters: string;
  action: string;
  affectedFiles: string[];
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  recommendations: AIRecommendationResult[];
  developerSummary: string;
}

// ── Configuration ────────────────────────────────────────────────

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export class OpenRouterConfigError extends Error {
  public readonly missingVars: string[];
  constructor(missingVars: string[]) {
    super(
      `OpenRouter AI is not configured. Missing environment variables: ${missingVars.join(", ")}`
    );
    this.name = "OpenRouterConfigError";
    this.missingVars = missingVars;
  }
}

export class OpenRouterAnalysisError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "OpenRouterAnalysisError";
    this.code = code;
  }
}

// Primary model — Nemotron 3 Super 120B: good quality, lower congestion than Ultra.
// Override with OPENROUTER_MODEL in .env.local to use a different model.
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

// Fallback models tried in order when the primary returns a provider-side 429.
// All IDs verified against OpenRouter's live free catalog (September 2026).
const FALLBACK_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",          // 1M ctx, fast MoE
  "poolside/laguna-s-2.1:free",                  // high token volume, reliable
  "nvidia/nemotron-3-ultra-550b-a55b:free",       // largest, most congested — last resort
];

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Read and validate OpenRouter configuration from env vars. */
export function getOpenRouterConfig(): OpenRouterConfig {
  const missing: string[] = [];

  const apiKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
  if (!apiKey) missing.push("OPENROUTER_API_KEY");

  if (missing.length > 0) {
    throw new OpenRouterConfigError(missing);
  }

  return {
    apiKey,
    model: (process.env.OPENROUTER_MODEL ?? "").trim() || DEFAULT_MODEL,
    baseUrl: OPENROUTER_BASE_URL,
  };
}

/** Check if OpenRouter is configured (non-throwing). */
export function isOpenRouterConfigured(): boolean {
  const apiKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
  return !!apiKey;
}

// ── Prompt construction ─────────────────────────────────────────

const SYSTEM_PROMPT = `You are CodeHealth AI, a software engineering analysis assistant.

You receive structured results from a deterministic repository analysis engine.
Your job is to interpret those results for developers.

Rules:
1. Never invent files, metrics, functions, vulnerabilities, or test results.
2. Use only the evidence provided in the analysis context.
3. Do not recalculate or replace the deterministic health scores.
4. Explain why detected findings matter in practical terms.
5. Prioritize recommendations based on severity, developer impact, and evidence.
6. Give concrete, actionable remediation steps.
7. Distinguish confirmed scanner findings from general recommendations.
8. Keep the response concise and developer-focused.
9. If the available data is insufficient to make a conclusion, explicitly say so.
10. Return ONLY valid JSON matching the requested schema. Do not include any text before or after the JSON.`;

const USER_PROMPT_TEMPLATE = (contextJson: string, truncationNote: string) =>
  `Analyze the following deterministic code analysis results and produce a structured JSON response.

<repository_analysis>
${contextJson}
</repository_analysis>
${truncationNote}
Respond with ONLY this JSON structure (no markdown, no explanation outside the JSON):

{
  "summary": "2-4 sentence holistic assessment of the codebase health",
  "strengths": ["strength 1", "strength 2"],
  "improvementAreas": ["area 1", "area 2"],
  "recommendations": [
    {
      "priority": 1,
      "severity": "critical|high|medium|low",
      "title": "Short action-oriented title",
      "whyItMatters": "Why this finding matters for the team",
      "action": "Specific steps the developer should take",
      "affectedFiles": ["file/path.ts"]
    }
  ],
  "developerSummary": "One sentence developer-friendly summary"
}

Requirements:
- recommendations must be sorted by priority (1 = most important)
- severity must match the scanner's finding severity — do not change it
- affectedFiles must only contain files mentioned in the analysis context
- keep each string field under 500 characters
- provide 2-5 recommendations
- provide 2-4 strengths and 2-4 improvement areas`;

function buildMessages(context: AIContext): { role: "system" | "user"; content: string }[] {
  const contextJson = JSON.stringify(context, null, 2);
  const truncationNote = context.findingsTruncated
    ? `\nNote: The findings list above is truncated. Total findings: ${context.findingsSummary.total} (critical: ${context.findingsSummary.critical}, high: ${context.findingsSummary.high}, medium: ${context.findingsSummary.medium}, low: ${context.findingsSummary.low}).\n`
    : "\n";

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: USER_PROMPT_TEMPLATE(contextJson, truncationNote) },
  ];
}

// ── Response validation ─────────────────────────────────────────

function isValidSeverity(v: unknown): v is AIRecommendationResult["severity"] {
  return v === "critical" || v === "high" || v === "medium" || v === "low";
}

function validateRecommendation(r: unknown, idx: number): AIRecommendationResult {
  if (typeof r !== "object" || r === null) {
    throw new Error(`recommendations[${idx}] is not an object`);
  }
  const rec = r as Record<string, unknown>;

  if (typeof rec.priority !== "number") throw new Error(`recommendations[${idx}].priority must be a number`);
  if (!isValidSeverity(rec.severity)) throw new Error(`recommendations[${idx}].severity must be critical|high|medium|low`);
  if (typeof rec.title !== "string" || !rec.title) throw new Error(`recommendations[${idx}].title must be a non-empty string`);
  if (typeof rec.whyItMatters !== "string" || !rec.whyItMatters) throw new Error(`recommendations[${idx}].whyItMatters must be a non-empty string`);
  if (typeof rec.action !== "string" || !rec.action) throw new Error(`recommendations[${idx}].action must be a non-empty string`);
  if (!Array.isArray(rec.affectedFiles)) throw new Error(`recommendations[${idx}].affectedFiles must be an array`);

  return {
    priority: rec.priority,
    severity: rec.severity,
    title: String(rec.title).slice(0, 500),
    whyItMatters: String(rec.whyItMatters).slice(0, 500),
    action: String(rec.action).slice(0, 500),
    affectedFiles: (rec.affectedFiles as unknown[])
      .filter((f) => typeof f === "string")
      .map((f) => String(f).slice(0, 300)),
  };
}

function validateAIResponse(raw: unknown): AIAnalysis {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Response is not a JSON object");
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.summary !== "string" || !obj.summary) throw new Error("summary must be a non-empty string");
  if (!Array.isArray(obj.strengths)) throw new Error("strengths must be an array");
  if (!Array.isArray(obj.improvementAreas)) throw new Error("improvementAreas must be an array");
  if (!Array.isArray(obj.recommendations)) throw new Error("recommendations must be an array");
  if (typeof obj.developerSummary !== "string" || !obj.developerSummary) throw new Error("developerSummary must be a non-empty string");

  if (obj.recommendations.length === 0) throw new Error("recommendations array must not be empty");

  return {
    summary: String(obj.summary).slice(0, 2000),
    strengths: (obj.strengths as unknown[])
      .filter((s) => typeof s === "string")
      .map((s) => String(s).slice(0, 300)),
    improvementAreas: (obj.improvementAreas as unknown[])
      .filter((s) => typeof s === "string")
      .map((s) => String(s).slice(0, 300)),
    recommendations: (obj.recommendations as unknown[]).map((r, i) => validateRecommendation(r, i)),
    developerSummary: String(obj.developerSummary).slice(0, 500),
  };
}

/**
 * Attempt to extract a JSON object from a string that may contain
 * extra text (e.g. markdown code fences or a preamble).
 */
function extractJsonFromText(text: string): unknown {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // Try parsing as-is first
  try {
    return JSON.parse(candidate);
  } catch {
    // Fall through to extraction attempt
  }

  // Find the outermost { ... } block
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }

  return JSON.parse(candidate.slice(start, end + 1)); // throws if still invalid
}

// ── Single-model request ─────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 90_000; // 90 seconds

type RequestResult =
  | { rateLimited: true; retryAfterMs?: number }
  | { rateLimited: false; analysis: AIAnalysis & { modelId: string } };

async function callModel(
  config: OpenRouterConfig,
  model: string,
  messages: { role: "system" | "user"; content: string }[]
): Promise<RequestResult> {
  const requestBody = {
    model,
    messages,
    temperature: 0.1,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "https://localhost:3000",
        "X-Title": "CodeHealth AI",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new OpenRouterAnalysisError(
        `Request to OpenRouter (${model}) timed out after 90 seconds.`,
        "TIMEOUT"
      );
    }
    throw new OpenRouterAnalysisError(
      "Failed to reach OpenRouter service. Check network connectivity.",
      "NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    // Provider-side or platform rate limit — signal caller to try fallback
    const retryAfterSec = Number(response.headers.get("Retry-After") ?? "0");
    let errText = "";
    try { errText = await response.text(); } catch { /* ignore */ }
    console.warn(`[openrouter] 429 on ${model}${errText ? ` — ${errText.slice(0, 120)}` : ""}`);
    return { rateLimited: true, retryAfterMs: retryAfterSec > 0 ? retryAfterSec * 1000 : undefined };
  }

  if (!response.ok) {
    let code = "API_ERROR";
    let message = `OpenRouter returned HTTP ${response.status}.`;

    try {
      const errText = await response.text();
      const errJson = JSON.parse(errText) as { error?: { message?: string } };
      const detail = errJson.error?.message ?? "";
      console.error(`[openrouter] HTTP ${response.status} on ${model} — ${detail.slice(0, 200)}`);
    } catch { /* ignore */ }

    if (response.status === 401 || response.status === 403) {
      code = "AUTH_ERROR";
      message = "OpenRouter authentication failed. Verify OPENROUTER_API_KEY is correct.";
    } else if (response.status === 404) {
      code = "MODEL_NOT_FOUND";
      message = `Model '${model}' not found on OpenRouter. Verify OPENROUTER_MODEL.`;
    } else if (response.status >= 500) {
      code = "SERVICE_ERROR";
      message = "OpenRouter service error. Please retry later.";
    }

    console.error(`[openrouter] API error: ${response.status} (${code}) on ${model}`);
    throw new OpenRouterAnalysisError(message, code);
  }

  let responseData: { choices?: Array<{ message?: { content?: string } }>; model?: string };
  try {
    responseData = await response.json() as typeof responseData;
  } catch {
    throw new OpenRouterAnalysisError("Failed to parse OpenRouter response as JSON.", "PARSE_ERROR");
  }

  const content = responseData.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new OpenRouterAnalysisError("OpenRouter returned an empty response.", "EMPTY_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = extractJsonFromText(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error(`[openrouter] JSON extraction failed on ${model}: ${detail}`);
    throw new OpenRouterAnalysisError(
      "AI response could not be parsed as structured JSON.",
      "JSON_PARSE_ERROR"
    );
  }

  let validated: AIAnalysis;
  try {
    validated = validateAIResponse(parsed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error(`[openrouter] Response validation failed on ${model}: ${detail}`);
    throw new OpenRouterAnalysisError(
      `AI response did not match the expected schema: ${detail}`,
      "VALIDATION_ERROR"
    );
  }

  return {
    rateLimited: false,
    analysis: { ...validated, modelId: responseData.model ?? model },
  };
}

// ── Main analysis function ───────────────────────────────────────

/**
 * Call OpenRouter with the analysis context and return validated AIAnalysis.
 * Automatically falls back through FALLBACK_MODELS on provider-side 429s.
 *
 * Throws OpenRouterConfigError if configuration is missing.
 * Throws OpenRouterAnalysisError for non-recoverable failures.
 */
export async function analyzeCodebase(context: AIContext): Promise<AIAnalysis & { modelId: string }> {
  const config = getOpenRouterConfig(); // throws OpenRouterConfigError if not configured
  const messages = buildMessages(context);

  // Build the model attempt order: configured/default first, then fallbacks
  const modelsToTry = [config.model, ...FALLBACK_MODELS.filter((m) => m !== config.model)];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    console.log(`[openrouter] Trying model ${i + 1}/${modelsToTry.length}: ${model}`);

    const result = await callModel(config, model, messages);

    if (!result.rateLimited) {
      return result.analysis;
    }

    // Rate-limited — wait briefly if a Retry-After header was given, then try next
    if (result.retryAfterMs && result.retryAfterMs <= 5000) {
      await new Promise((r) => setTimeout(r, result.retryAfterMs));
    }

    if (i < modelsToTry.length - 1) {
      console.log(`[openrouter] Model ${model} rate-limited, falling back to ${modelsToTry[i + 1]}`);
    }
  }

  // All models exhausted
  throw new OpenRouterAnalysisError(
    "All available AI models are currently rate-limited. Please try again in a minute.",
    "RATE_LIMIT"
  );
}
