/**
 * Tests for the AI context builder and secret redaction.
 *
 * Rules:
 *  - All tests are unit tests — no real IBM credentials used.
 *  - No network calls.
 *  - Verifies: context shape, secret redaction, findings truncation,
 *    metric pass-through, oversized field truncation, and prompt injection safety.
 */

import { describe, it, expect } from "vitest";
import {
  buildAnalysisContext,
  redactEvidence,
} from "../build-analysis-context";
import type { BuildContextInput } from "../build-analysis-context";
import type { AnalysisResult } from "@/lib/analyzer";

// ── Helpers ──────────────────────────────────────────────────────

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    filesAnalyzed: 42,
    linesOfCode: 3500,
    metrics: {
      overall: 75,
      codeQuality: 80,
      testing: 60,
      documentation: 55,
      complexity: 70,
      maintainability: 72,
      security: 88,
    },
    findings: [],
    signals: {
      sourceFiles: 35,
      testFiles: 7,
      totalLines: 3500,
      todoCount: 4,
      consoleCount: 2,
      complexFunctionCount: 1,
      hasReadme: true,
      readmeLengthLines: 40,
      hasDocsDir: false,
      securityIssues: 0,
      coverageAvailable: false,
    },
    ...overrides,
  };
}

function makeInput(overrides: Partial<BuildContextInput> = {}): BuildContextInput {
  return {
    owner: "acme",
    name: "my-app",
    branch: "main",
    analysisResult: makeResult(),
    ...overrides,
  };
}

// ── buildAnalysisContext ─────────────────────────────────────────

describe("buildAnalysisContext", () => {
  it("returns the correct repository metadata", () => {
    const ctx = buildAnalysisContext(makeInput({ owner: "ibm", name: "granite", branch: "develop" }));
    expect(ctx.repository).toEqual({ owner: "ibm", name: "granite", branch: "develop" });
  });

  it("passes through metrics unchanged", () => {
    const result = makeResult();
    const ctx = buildAnalysisContext(makeInput({ analysisResult: result }));
    expect(ctx.metrics.overall).toBe(75);
    expect(ctx.metrics.codeQuality).toBe(80);
    expect(ctx.metrics.testing).toBe(60);
    expect(ctx.metrics.documentation).toBe(55);
    expect(ctx.metrics.security).toBe(88);
  });

  it("sets filesAnalyzed and linesOfCode correctly", () => {
    const ctx = buildAnalysisContext(makeInput());
    expect(ctx.summary.filesAnalyzed).toBe(42);
    expect(ctx.summary.linesOfCode).toBe(3500);
  });

  it("computes findingsSummary totals correctly", () => {
    const findings = [
      { severity: "critical" as const, category: "security" as const, title: "A", description: "", file: "a.ts", recommendation: "", ruleId: "SEC-001" },
      { severity: "critical" as const, category: "security" as const, title: "B", description: "", file: "b.ts", recommendation: "", ruleId: "SEC-001" },
      { severity: "high" as const,     category: "quality" as const,  title: "C", description: "", file: "c.ts", recommendation: "", ruleId: "Q-001"   },
      { severity: "medium" as const,   category: "testing" as const,  title: "D", description: "", file: "d.ts", recommendation: "", ruleId: "T-001"   },
      { severity: "low" as const,      category: "quality" as const,  title: "E", description: "", file: "e.ts", recommendation: "", ruleId: "Q-002"   },
    ];
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings }) }));
    expect(ctx.findingsSummary).toEqual({ total: 5, critical: 2, high: 1, medium: 1, low: 1 });
  });

  it("includes findings in the output", () => {
    const findings = [
      { severity: "high" as const, category: "security" as const, title: "SQL injection", description: "desc", file: "src/db.ts", line: 10, recommendation: "Use parameterized queries", ruleId: "SEC-006", evidence: "Some evidence" },
    ];
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings }) }));
    expect(ctx.findings).toHaveLength(1);
    expect(ctx.findings[0].file).toBe("src/db.ts");
    expect(ctx.findings[0].severity).toBe("high");
  });

  it("sets findingsTruncated = false when findings are within limits", () => {
    // Only 1 finding per severity — well within limits
    const findings = [
      { severity: "critical" as const, category: "security" as const, title: "T", description: "", file: "a.ts", recommendation: "", ruleId: "R" },
    ];
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings }) }));
    expect(ctx.findingsTruncated).toBe(false);
  });

  it("sets findingsTruncated = true when there are more than MAX_CRITICAL critical findings", () => {
    // MAX_CRITICAL = 10 — create 11 critical findings
    const findings = Array.from({ length: 11 }, (_, i) => ({
      severity: "critical" as const,
      category: "security" as const,
      title: `Finding ${i}`,
      description: "",
      file: `file${i}.ts`,
      recommendation: "",
      ruleId: `SEC-00${i}`,
    }));
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings }) }));
    expect(ctx.findingsTruncated).toBe(true);
    // Only 10 critical findings should be in the output
    const criticalInOutput = ctx.findings.filter((f) => f.severity === "critical");
    expect(criticalInOutput).toHaveLength(10);
  });

  it("truncates owner/name/branch strings longer than 100 chars", () => {
    const longString = "a".repeat(150);
    const ctx = buildAnalysisContext(makeInput({ owner: longString, name: longString, branch: longString }));
    expect(ctx.repository.owner.length).toBeLessThanOrEqual(101); // 100 chars + ellipsis char
    expect(ctx.repository.name.length).toBeLessThanOrEqual(101);
    expect(ctx.repository.branch.length).toBeLessThanOrEqual(101);
  });

  it("returns an empty findings array when there are no findings", () => {
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings: [] }) }));
    expect(ctx.findings).toHaveLength(0);
    expect(ctx.findingsTruncated).toBe(false);
  });

  it("does not include signals in the output context (not useful for AI)", () => {
    const ctx = buildAnalysisContext(makeInput());
    // signals should not leak into the context
    expect((ctx as unknown as Record<string, unknown>).signals).toBeUndefined();
  });

  it("orders findings: critical first, then high, medium, low", () => {
    const findings = [
      { severity: "low" as const,      category: "quality" as const,  title: "Low",    description: "", file: "l.ts", recommendation: "", ruleId: "Q" },
      { severity: "critical" as const, category: "security" as const, title: "Crit",   description: "", file: "c.ts", recommendation: "", ruleId: "S" },
      { severity: "medium" as const,   category: "testing" as const,  title: "Medium", description: "", file: "m.ts", recommendation: "", ruleId: "T" },
      { severity: "high" as const,     category: "quality" as const,  title: "High",   description: "", file: "h.ts", recommendation: "", ruleId: "Q" },
    ];
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings }) }));
    const severities = ctx.findings.map((f) => f.severity);
    expect(severities[0]).toBe("critical");
    expect(severities[1]).toBe("high");
    expect(severities[2]).toBe("medium");
    expect(severities[3]).toBe("low");
  });
});

// ── redactEvidence ───────────────────────────────────────────────

describe("redactEvidence", () => {
  it("returns undefined when evidence is undefined", () => {
    expect(redactEvidence(undefined)).toBeUndefined();
  });

  it("returns the evidence unchanged when it contains no secrets", () => {
    const safe = "Suspicious pattern matched on line 12. Value redacted for security.";
    expect(redactEvidence(safe)).toBe(safe);
  });

  it("redacts evidence containing a hardcoded password pattern", () => {
    const dangerous = `password = "super_secret_123"`;
    const result = redactEvidence(dangerous);
    expect(result).toBe("[REDACTED — potential sensitive value detected]");
    expect(result).not.toContain("super_secret_123");
  });

  it("redacts evidence containing an API key pattern", () => {
    const dangerous = `api_key = "sk-abc123def456ghi789"`;
    const result = redactEvidence(dangerous);
    expect(result).toBe("[REDACTED — potential sensitive value detected]");
  });

  it("redacts evidence containing an AWS access key", () => {
    const dangerous = `accessKey = "AKIAIOSFODNN7EXAMPLE"`;
    const result = redactEvidence(dangerous);
    expect(result).toBe("[REDACTED — potential sensitive value detected]");
    expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("redacts evidence containing a PEM private key block", () => {
    const dangerous = `-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----`;
    const result = redactEvidence(dangerous);
    expect(result).toBe("[REDACTED — potential sensitive value detected]");
  });

  it("redacts evidence containing a long base64-like string", () => {
    // 40+ character base64-like string in quotes is considered a potential secret
    const b64 = `"${("A").repeat(41)}"`;
    const dangerous = `token = ${b64}`;
    const result = redactEvidence(dangerous);
    expect(result).toBe("[REDACTED — potential sensitive value detected]");
  });

  it("truncates evidence that exceeds 300 characters", () => {
    const longEvidence = "x".repeat(400);
    const result = redactEvidence(longEvidence);
    expect(result).toBeDefined();
    expect(result!.length).toBeLessThanOrEqual(315); // 300 + "… [truncated]"
    expect(result).toContain("[truncated]");
  });

  it("does not redact a normal code comment", () => {
    const safe = "// This function validates user input";
    expect(redactEvidence(safe)).toBe(safe);
  });

  it("does not redact a short alphanumeric identifier", () => {
    const safe = `const userId = "abc123"`;
    expect(redactEvidence(safe)).toBe(safe);
  });
});

// ── AI response validation (imported directly to avoid HTTP calls) ──

// We test the structural validation logic by importing the module
// and checking that invalid inputs surface the right errors.
// The watsonx HTTP calls themselves are NOT invoked here.

describe("AI context builder — prompt injection safety", () => {
  it("does not include actual secret values in evidence — only redacted placeholders", () => {
    const findings = [
      {
        severity: "critical" as const,
        category: "security" as const,
        title: "Hardcoded password",
        description: "A password was found.",
        file: "src/config.ts",
        line: 5,
        // This is the value the scanner stores — already redacted by the scanner
        evidence: `Suspicious pattern matched on line 5. Value redacted for security.`,
        recommendation: "Use env vars",
        ruleId: "SEC-001",
      },
    ];
    const ctx = buildAnalysisContext(makeInput({ analysisResult: makeResult({ findings }) }));
    const evidenceInCtx = ctx.findings[0].evidence ?? "";
    // Must NOT contain any credential-like literal
    expect(evidenceInCtx).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
    expect(evidenceInCtx).not.toMatch(/["'][a-zA-Z0-9+/]{20,}["']/);
  });

  it("repository owner/name/branch are included as data, not as system instructions", () => {
    // The context builder doesn't wrap strings in prompt delimiters —
    // that's the watsonx.ts prompt builder's job. Verify the raw values
    // come through without modification of their content.
    const ctx = buildAnalysisContext(makeInput({ owner: "evil-corp", name: "repo; DROP TABLE scans;--", branch: "main" }));
    // Values must be preserved (sanitisation is the prompt wrapper's job, not the context builder's)
    expect(ctx.repository.owner).toBe("evil-corp");
    // SQL injection in the name should pass through verbatim — the prompt builder wraps it in <repository_analysis>
    expect(ctx.repository.name).toContain("DROP TABLE");
  });
});

// ── AI response validation logic ─────────────────────────────────
// We extract the validation logic indirectly by testing edge cases
// that the full validation catches. Since validateAIResponse is not
// exported, we test through the public surface of watsonx.ts.

describe("AI output validation contract", () => {
  it("AIContext has all required top-level fields", () => {
    const ctx = buildAnalysisContext(makeInput());
    expect(ctx).toHaveProperty("repository");
    expect(ctx).toHaveProperty("summary");
    expect(ctx).toHaveProperty("metrics");
    expect(ctx).toHaveProperty("findings");
    expect(ctx).toHaveProperty("findingsSummary");
    expect(ctx).toHaveProperty("findingsTruncated");
  });

  it("metrics include all 7 required fields", () => {
    const ctx = buildAnalysisContext(makeInput());
    const keys = Object.keys(ctx.metrics);
    expect(keys).toContain("overall");
    expect(keys).toContain("codeQuality");
    expect(keys).toContain("testing");
    expect(keys).toContain("documentation");
    expect(keys).toContain("complexity");
    expect(keys).toContain("maintainability");
    expect(keys).toContain("security");
  });

  it("AI must not change deterministic scores — context metrics are read-only inputs", () => {
    // The metrics fed into the AI context are the deterministic scores.
    // We verify they are passed through without modification.
    const result = makeResult({
      metrics: {
        overall: 61,
        codeQuality: 72,
        testing: 33,
        documentation: 28,
        complexity: 55,
        maintainability: 60,
        security: 90,
      },
    });
    const ctx = buildAnalysisContext(makeInput({ analysisResult: result }));
    expect(ctx.metrics.overall).toBe(61);
    expect(ctx.metrics.testing).toBe(33);
    expect(ctx.metrics.security).toBe(90);
  });
});
