/**
 * IBM watsonx.ai Integration
 *
 * Server-side only. This module MUST NOT be imported in client components.
 *
 * Responsibilities:
 *  1. Validate watsonx.ai configuration from environment variables.
 *  2. Obtain an IBM Cloud IAM bearer token from the API key.
 *  3. Build the structured AI prompt from analysis context.
 *  4. Call the watsonx.ai /ml/v1/text/generation API.
 *  5. Parse and validate the structured JSON response.
 *  6. Return a typed AIAnalysis result or throw a typed error.
 *
 * Environment variables required (server-side only — never expose to client):
 *   WATSONX_API_KEY      IBM Cloud API key
 *   WATSONX_PROJECT_ID   watsonx.ai project ID
 *   WATSONX_URL          watsonx.ai service URL (default: https://us-south.ml.cloud.ibm.com)
 *   WATSONX_MODEL_ID     model ID (default: ibm/granite-13b-chat-v2)
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

export interface WatsonxConfig {
  apiKey: string;
  projectId: string;
  url: string;
  modelId: string;
}

export class WatsonxConfigError extends Error {
  public readonly missingVars: string[];
  constructor(missingVars: string[]) {
    super(
      `IBM watsonx.ai is not configured. Missing environment variables: ${missingVars.join(", ")}`
    );
    this.name = "WatsonxConfigError";
    this.missingVars = missingVars;
  }
}

export class WatsonxAnalysisError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "WatsonxAnalysisError";
    this.code = code;
  }
}

/** Read and validate watsonx.ai configuration from env vars. */
export function getWatsonxConfig(): WatsonxConfig {
  const missing: string[] = [];

  const apiKey = (process.env.WATSONX_API_KEY ?? "").trim();
  const projectId = (process.env.WATSONX_PROJECT_ID ?? "").trim();

  if (!apiKey) missing.push("WATSONX_API_KEY");
  if (!projectId) missing.push("WATSONX_PROJECT_ID");

  if (missing.length > 0) {
    throw new WatsonxConfigError(missing);
  }

  return {
    apiKey,
    projectId,
    url: process.env.WATSONX_URL ?? "https://us-south.ml.cloud.ibm.com",
    modelId: process.env.WATSONX_MODEL_ID ?? "ibm/granite-13b-chat-v2",
  };
}

/** Check if watsonx.ai is configured (non-throwing). */
export function isWatsonxConfigured(): boolean {
  const apiKey = (process.env.WATSONX_API_KEY ?? "").trim();
  const projectId = (process.env.WATSONX_PROJECT_ID ?? "").trim();
  return !!(apiKey && projectId);
}

// ── IBM Cloud IAM token exchange ────────────────────────────────

const IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token";
const TOKEN_CACHE: { token: string; expiresAt: number } | null = null;

// Module-level mutable cache (safe in Node.js server context)
let _tokenCache: { token: string; expiresAt: number } | null = TOKEN_CACHE;

/**
 * Exchange an IBM Cloud API key for a short-lived IAM bearer token.
 * Caches the token until 5 minutes before expiry.
 */
async function getIAMToken(apiKey: string): Promise<string> {
  const now = Date.now();

  if (_tokenCache && _tokenCache.expiresAt > now + 5 * 60 * 1000) {
    return _tokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: "urn:ibm:params:oauth:grant-type:apikey",
    apikey: apiKey,
  });

  let response: Response;
  try {
    response = await fetch(IAM_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    throw new WatsonxAnalysisError(
      "Failed to reach IBM Cloud IAM service. Check network connectivity.",
      "IAM_NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const text = await response.text();
      // Don't log or return the raw error which might include sensitive details
      detail = response.status === 400
        ? "Invalid API key format."
        : response.status === 401 || response.status === 403
        ? "API key authentication failed. Verify WATSONX_API_KEY is correct."
        : `IAM service returned HTTP ${response.status}.`;
      void text; // intentionally ignored to prevent secret leakage
    } catch {
      detail = `IAM service returned HTTP ${response.status}.`;
    }
    throw new WatsonxAnalysisError(detail, "IAM_AUTH_ERROR");
  }

  let data: { access_token?: string; expires_in?: number };
  try {
    data = await response.json() as { access_token?: string; expires_in?: number };
  } catch {
    throw new WatsonxAnalysisError("Invalid response from IBM Cloud IAM.", "IAM_PARSE_ERROR");
  }

  if (!data.access_token) {
    throw new WatsonxAnalysisError("IBM Cloud IAM did not return an access token.", "IAM_NO_TOKEN");
  }

  const expiresIn = data.expires_in ?? 3600; // default 1 hour
  _tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };

  return _tokenCache.token;
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

function buildPrompt(context: AIContext): string {
  // Delimit repository-derived content so the model treats it as DATA, not instructions.
  const contextJson = JSON.stringify(context, null, 2);

  return `${SYSTEM_PROMPT}

Analyze the following deterministic code analysis results and produce a structured JSON response.

<repository_analysis>
${contextJson}
</repository_analysis>

${context.findingsTruncated ? `Note: The findings list above is truncated. Total findings: ${context.findingsSummary.total} (critical: ${context.findingsSummary.critical}, high: ${context.findingsSummary.high}, medium: ${context.findingsSummary.medium}, low: ${context.findingsSummary.low}).` : ""}

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
 * extra text (e.g. "Here is the JSON: {...}").
 * Only used when the model response is not pure JSON.
 */
function extractJsonFromText(text: string): unknown {
  // Try parsing as-is first
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to extraction attempt
  }

  // Find the outermost { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }

  const extracted = text.slice(start, end + 1);
  return JSON.parse(extracted); // throws if still invalid
}

// ── Main analysis function ───────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 60_000; // 60 seconds

/**
 * Call IBM watsonx.ai with the analysis context and return validated AIAnalysis.
 *
 * Throws WatsonxConfigError if configuration is missing.
 * Throws WatsonxAnalysisError for API/network/parsing failures.
 */
export async function analyzeCodebase(context: AIContext): Promise<AIAnalysis & { modelId: string }> {
  const config = getWatsonxConfig(); // throws WatsonxConfigError if not configured

  const iamToken = await getIAMToken(config.apiKey);
  const prompt = buildPrompt(context);

  const requestBody = {
    model_id: config.modelId,
    input: prompt,
    parameters: {
      decoding_method: "greedy",
      max_new_tokens: 2000,
      min_new_tokens: 100,
      stop_sequences: [],
      repetition_penalty: 1.05,
    },
    project_id: config.projectId,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `${config.url}/ml/v1/text/generation?version=2023-05-29`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${iamToken}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new WatsonxAnalysisError(
        "Request to IBM watsonx.ai timed out after 60 seconds.",
        "TIMEOUT"
      );
    }
    throw new WatsonxAnalysisError(
      "Failed to reach IBM watsonx.ai service. Check network connectivity.",
      "NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let code = "API_ERROR";
    let message = `IBM watsonx.ai returned HTTP ${response.status}.`;

    // Try to extract IBM's error message for server-side logging (never exposed to client)
    try {
      const errBody = await response.text();
      const errJson = JSON.parse(errBody) as { errors?: { code?: string; message?: string }[] };
      const ibmCode = errJson.errors?.[0]?.code ?? "";
      const ibmMsg  = errJson.errors?.[0]?.message ?? "";
      // Log safely — no credentials, just the IBM error code and first 200 chars of message
      console.error(`[watsonx] HTTP ${response.status} — IBM code: ${ibmCode} — ${ibmMsg.slice(0, 200)}`);

      if (response.status === 401 || response.status === 403) {
        code = "AUTH_ERROR";
        if (ibmCode === "user_authorization_failed" || ibmMsg.includes("member in project")) {
          message = `Your IBM API key does not have access to project ${config.projectId}. ` +
            `Go to https://dataplatform.cloud.ibm.com/projects, open the project → Manage → ` +
            `Access Control, and add your IBMid as a collaborator with Editor or Admin role.`;
        } else {
          message = "IBM watsonx.ai authentication failed. Verify WATSONX_API_KEY and WATSONX_PROJECT_ID.";
        }
      } else if (response.status === 429) {
        code = "RATE_LIMIT";
        message = "IBM watsonx.ai rate limit reached. Please retry shortly.";
      } else if (response.status === 404) {
        code = "MODEL_NOT_FOUND";
        message = `Model '${config.modelId}' not found. Verify WATSONX_MODEL_ID.`;
      } else if (response.status >= 500) {
        code = "SERVICE_ERROR";
        message = "IBM watsonx.ai service error. Please retry later.";
      }
    } catch {
      // Failed to parse error body — use generic messages above
      if (response.status === 401 || response.status === 403) {
        code = "AUTH_ERROR";
        message = "IBM watsonx.ai authentication failed. Verify WATSONX_API_KEY and WATSONX_PROJECT_ID.";
      } else if (response.status === 429) {
        code = "RATE_LIMIT";
        message = "IBM watsonx.ai rate limit reached. Please retry shortly.";
      } else if (response.status === 404) {
        code = "MODEL_NOT_FOUND";
        message = `Model '${config.modelId}' not found. Verify WATSONX_MODEL_ID.`;
      } else if (response.status >= 500) {
        code = "SERVICE_ERROR";
        message = "IBM watsonx.ai service error. Please retry later.";
      }
    }

    console.error(`[watsonx] API error: ${response.status} (${code})`);
    throw new WatsonxAnalysisError(message, code);
  }

  let responseData: {
    results?: Array<{ generated_text?: string }>;
    model_id?: string;
  };
  try {
    responseData = await response.json() as typeof responseData;
  } catch {
    throw new WatsonxAnalysisError("Failed to parse IBM watsonx.ai response as JSON.", "PARSE_ERROR");
  }

  const generatedText = responseData.results?.[0]?.generated_text;
  if (!generatedText || typeof generatedText !== "string") {
    throw new WatsonxAnalysisError("IBM watsonx.ai returned an empty response.", "EMPTY_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = extractJsonFromText(generatedText);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error(`[watsonx] JSON extraction failed: ${detail}`);
    throw new WatsonxAnalysisError(
      "AI response could not be parsed as structured JSON. The model may have returned free-form text.",
      "JSON_PARSE_ERROR"
    );
  }

  let validated: AIAnalysis;
  try {
    validated = validateAIResponse(parsed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error(`[watsonx] Response validation failed: ${detail}`);
    throw new WatsonxAnalysisError(
      `AI response did not match the expected schema: ${detail}`,
      "VALIDATION_ERROR"
    );
  }

  return {
    ...validated,
    modelId: responseData.model_id ?? config.modelId,
  };
}
