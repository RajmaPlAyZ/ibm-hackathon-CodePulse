/**
 * AI Context Builder
 *
 * Transforms deterministic scan results into a sanitized, token-efficient
 * context payload for IBM watsonx.ai.
 *
 * Rules:
 *  - Never include credentials, tokens, or secrets in the context.
 *  - Redact evidence strings that look like they contain sensitive values.
 *  - Limit finding count to avoid excessive token usage.
 *  - Normalize field names to a stable contract for the AI prompt.
 *  - Treat all repository-derived strings as untrusted data (delimited in prompt).
 */

import type { AnalysisResult, RawFinding } from "@/lib/analyzer";

// ── Max findings sent to the model (token budget control) ───────
const MAX_CRITICAL = 10;
const MAX_HIGH = 10;
const MAX_MEDIUM = 5;
const MAX_LOW = 3;

// ── Patterns that indicate a field may contain a secret value ───
const SECRET_PATTERNS = [
  /(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|auth[_-]?token|private[_-]?key|credential)\s*[=:]\s*["'][^"']+["']/i,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN\s+(?:RSA|EC|OPENSSH|DSA)?\s*PRIVATE KEY-----/,
  /["'][a-zA-Z0-9+/]{40,}={0,2}["']/,  // base64-like long strings
];

/** Redact any evidence string that looks like it may contain a secret value. */
export function redactEvidence(evidence: string | undefined): string | undefined {
  if (!evidence) return undefined;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(evidence)) {
      return "[REDACTED — potential sensitive value detected]";
    }
  }
  // Also truncate very long evidence strings
  if (evidence.length > 300) {
    return evidence.slice(0, 300) + "… [truncated]";
  }
  return evidence;
}

/** Truncate a string to a maximum length. */
function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ── Context types ────────────────────────────────────────────────

export interface AIContextFinding {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  file: string;
  line?: number;
  evidence?: string;     // always redacted
  recommendation: string;
  ruleId: string;
}

export interface AIContext {
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
  summary: {
    filesAnalyzed: number;
    linesOfCode: number;
  };
  metrics: {
    overall: number;
    codeQuality: number;
    testing: number;
    documentation: number;
    complexity: number;
    maintainability: number;
    security: number;
  };
  findingsSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findings: AIContextFinding[];
  // Note for the model about truncation
  findingsTruncated: boolean;
}

// ── Priority order for selecting findings to send ───────────────
const SEVERITY_ORDER: RawFinding["severity"][] = ["critical", "high", "medium", "low"];

function pickFindings(findings: RawFinding[]): { picked: AIContextFinding[]; truncated: boolean } {
  const limits: Record<RawFinding["severity"], number> = {
    critical: MAX_CRITICAL,
    high: MAX_HIGH,
    medium: MAX_MEDIUM,
    low: MAX_LOW,
  };

  const picked: AIContextFinding[] = [];
  let truncated = false;

  for (const sev of SEVERITY_ORDER) {
    const group = findings.filter((f) => f.severity === sev);
    const limit = limits[sev];
    if (group.length > limit) truncated = true;

    for (const f of group.slice(0, limit)) {
      picked.push({
        severity: f.severity,
        category: f.category,
        title: truncate(f.title, 120),
        file: f.file,
        line: f.line,
        evidence: redactEvidence(f.evidence),
        recommendation: truncate(f.recommendation, 200),
        ruleId: f.ruleId,
      });
    }
  }

  return { picked, truncated };
}

// ── Main builder ─────────────────────────────────────────────────

export interface BuildContextInput {
  owner: string;
  name: string;
  branch: string;
  analysisResult: AnalysisResult;
}

export function buildAnalysisContext(input: BuildContextInput): AIContext {
  const { owner, name, branch, analysisResult } = input;
  const { metrics, findings, filesAnalyzed, linesOfCode } = analysisResult;

  const { picked, truncated } = pickFindings(findings);

  return {
    repository: {
      owner: truncate(owner, 100),
      name: truncate(name, 100),
      branch: truncate(branch, 100),
    },
    summary: {
      filesAnalyzed,
      linesOfCode,
    },
    metrics: {
      overall: metrics.overall,
      codeQuality: metrics.codeQuality,
      testing: metrics.testing,
      documentation: metrics.documentation,
      complexity: metrics.complexity,
      maintainability: metrics.maintainability,
      security: metrics.security,
    },
    findingsSummary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    findings: picked,
    findingsTruncated: truncated,
  };
}
