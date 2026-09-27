/**
 * CodeHealth Static Analysis Engine
 * 
 * A deterministic, rule-based analyzer for GitHub repositories.
 * No AI is used here — all scores are calculated from measurable signals.
 * 
 * Health Score Formula:
 *   codeQuality    × 0.25
 *   testing        × 0.20
 *   documentation  × 0.15
 *   security       × 0.15
 *   maintainability× 0.15
 *   complexity     × 0.10
 */

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface RawFinding {
  severity: "critical" | "high" | "medium" | "low";
  category: "security" | "quality" | "complexity" | "documentation" | "testing" | "maintainability";
  title: string;
  description: string;
  file: string;
  line?: number;
  evidence?: string;
  recommendation: string;
  ruleId: string;
}

export interface AnalysisResult {
  filesAnalyzed: number;
  linesOfCode: number;
  metrics: {
    codeQuality: number;
    testing: number;
    documentation: number;
    complexity: number;
    maintainability: number;
    security: number;
    overall: number;
  };
  findings: RawFinding[];
  // Raw signals (for transparency)
  signals: {
    sourceFiles: number;
    testFiles: number;
    totalLines: number;
    todoCount: number;
    consoleCount: number;
    complexFunctionCount: number;
    hasReadme: boolean;
    readmeLengthLines: number;
    hasDocsDir: boolean;
    securityIssues: number;
    coverageAvailable: boolean;
  };
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

// ──────────────────────────────────────────────────────────────
// File classification
// ──────────────────────────────────────────────────────────────

const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx",
  ".py", ".java", ".go", ".rb", ".rs",
  ".cs", ".cpp", ".c", ".h",
  ".php", ".swift", ".kt",
]);

const TEST_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /_test\.(py|go|rb|java)$/,
  /^test_.*\.(py)$/,
  /Test\.(java|kt)$/,
  /tests?\//,
  /__tests__\//,
  /spec\//,
];

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".rst", ".txt"]);
// CONFIG_EXTENSIONS retained for future use (currently unused in scoring)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CONFIG_EXTENSIONS = new Set([".json", ".yml", ".yaml", ".toml", ".env.example"]);

function isSourceFile(path: string): boolean {
  const ext = getExtension(path);
  return SOURCE_EXTENSIONS.has(ext);
}

function isTestFile(path: string): boolean {
  return TEST_PATTERNS.some((p) => p.test(path));
}

function isDocFile(path: string): boolean {
  return DOC_EXTENSIONS.has(getExtension(path));
}

function getExtension(path: string): string {
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx).toLowerCase() : "";
}

// ──────────────────────────────────────────────────────────────
// Security patterns
// Each pattern includes a severity + ruleId + recommendation
// IMPORTANT: matched content is NEVER returned verbatim.
// ──────────────────────────────────────────────────────────────

interface SecurityRule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: "SEC-001",
    name: "Hardcoded password",
    // matches: password = "...", password: "..."
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*["'][^"']{3,}["']/i,
    severity: "critical",
    description:
      "A hardcoded password-like value was found in source code. Credentials committed to version control can be extracted by anyone with repository access.",
    recommendation:
      "Move the credential to an environment variable and rotate it immediately if it has been exposed in commit history.",
  },
  {
    id: "SEC-002",
    name: "Hardcoded API key or token",
    pattern:
      /(?:api[_-]?key|api[_-]?token|access[_-]?token|auth[_-]?token|secret[_-]?key)\s*[=:]\s*["'][a-zA-Z0-9_\-./+]{8,}["']/i,
    severity: "critical",
    description:
      "A hardcoded API key or token was detected. Tokens in source code may be exposed to all repository contributors.",
    recommendation:
      "Replace the hardcoded value with an environment variable (e.g. process.env.API_KEY) and rotate the exposed key.",
  },
  {
    id: "SEC-003",
    name: "AWS access key",
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: "critical",
    description:
      "A string matching the AWS access key format (AKIA…) was detected.",
    recommendation:
      "Revoke this key immediately via the AWS IAM console. Use environment variables or AWS Secrets Manager.",
  },
  {
    id: "SEC-004",
    name: "Private key block",
    pattern: /-----BEGIN\s+(RSA|EC|OPENSSH|DSA)?\s*PRIVATE KEY-----/,
    severity: "critical",
    description:
      "A PEM-encoded private key block was found. Private keys must never be committed to version control.",
    recommendation:
      "Remove the key from source code, regenerate the key pair, and use a secrets manager.",
  },
  {
    id: "SEC-005",
    name: "Dangerous eval() usage",
    pattern: /\beval\s*\(/,
    severity: "high",
    description:
      "Usage of eval() can execute arbitrary code and is a common attack vector.",
    recommendation:
      "Avoid eval(). Use JSON.parse() for JSON, or safer alternatives depending on the use case.",
  },
  {
    id: "SEC-006",
    name: "SQL string concatenation",
    pattern:
      /(?:query|sql|execute)\s*[+]=?\s*(?:["'`].*(?:WHERE|FROM|SELECT|INSERT|UPDATE|DELETE)|[a-zA-Z_]\w*\s*\+)/i,
    severity: "high",
    description:
      "SQL query string concatenation detected. This pattern is a common source of SQL injection vulnerabilities.",
    recommendation:
      "Use parameterized queries or a query builder (e.g. knex, prisma, hibernate) instead of string concatenation.",
  },
  {
    id: "SEC-007",
    name: "console.log in production code",
    pattern: /\bconsole\.(log|debug|info|warn|error)\s*\(/,
    severity: "low",
    description:
      "Debug console statements found in source code. These may leak sensitive information in production.",
    recommendation:
      "Remove or replace with a structured logger that can be disabled in production environments.",
  },
  {
    id: "SEC-008",
    name: "Hardcoded localhost/127.0.0.1 URL",
    pattern: /["'`]https?:\/\/(?:localhost|127\.0\.0\.1):\d+/,
    severity: "low",
    description:
      "Hardcoded localhost URLs can cause failures in production deployments.",
    recommendation:
      "Use environment variables for service URLs.",
  },
];

// ──────────────────────────────────────────────────────────────
// Code quality patterns
// ──────────────────────────────────────────────────────────────

const TODO_PATTERN = /\b(?:TODO|FIXME|HACK|XXX|BUG)\b/g;
const LONG_LINE_THRESHOLD = 200;

// Simple cyclomatic complexity proxy: count branching keywords
function estimateComplexity(content: string): number {
  const branchKeywords =
    /\b(if|else if|else|for|while|do|switch|case|catch|&&|\|\||\?)\b/g;
  return (content.match(branchKeywords) ?? []).length;
}

// Detect functions in JS/TS and estimate their size
function findComplexFunctions(
  path: string,
  content: string,
  threshold = 10
): { name: string; line: number; complexity: number }[] {
  if (!/\.(ts|tsx|js|jsx)$/.test(path)) return [];

  const results: { name: string; line: number; complexity: number }[] = [];
  const lines = content.split("\n");

  // Find function declarations and their bodies
  const funcPattern =
    /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))/g;

  let match: RegExpExecArray | null;
  while ((match = funcPattern.exec(content)) !== null) {
    const name = match[1] ?? match[2] ?? "anonymous";
    const charIdx = match.index;
    const lineNum = content.slice(0, charIdx).split("\n").length;

    // Extract function body (next 60 lines as proxy)
    const bodyStart = lineNum - 1;
    const bodyEnd = Math.min(bodyStart + 60, lines.length);
    const body = lines.slice(bodyStart, bodyEnd).join("\n");
    const complexity = estimateComplexity(body);

    if (complexity >= threshold) {
      results.push({ name, line: lineNum, complexity });
    }
  }

  return results;
}

// Count JSDoc-style comments as documentation signals
function countJsDocComments(content: string): number {
  return (content.match(/\/\*\*[\s\S]*?\*\//g) ?? []).length;
}

// ──────────────────────────────────────────────────────────────
// Main analyzer
// ──────────────────────────────────────────────────────────────

export function analyzeFiles(files: FileContent[]): AnalysisResult {
  const findings: RawFinding[] = [];

  // Classify files
  const sourceFiles = files.filter((f) => isSourceFile(f.path) && !isTestFile(f.path));
  const testFiles = files.filter((f) => isTestFile(f.path));
  // Retained for future documentation-coverage metrics
  const _docFiles = files.filter((f) => isDocFile(f.path)); // eslint-disable-line @typescript-eslint/no-unused-vars

  const readme = files.find((f) =>
    /^readme\.md$/i.test(f.path.split("/").pop() ?? "")
  );
  const hasDocsDir = files.some((f) => /^docs?\//i.test(f.path));

  // ── 1. Count lines ────────────────────────────────────────
  let totalLines = 0;
  for (const f of files) {
    totalLines += f.content.split("\n").length;
  }

  // ── 2. Quality signals ────────────────────────────────────
  let todoCount = 0;
  let consoleCount = 0;
  let longLineCount = 0;
  let jsDocCount = 0;

  for (const f of sourceFiles) {
    const todos = f.content.match(TODO_PATTERN);
    todoCount += todos?.length ?? 0;

    const consoleLogs = f.content.match(/\bconsole\.(log|debug|info)\s*\(/g);
    consoleCount += consoleLogs?.length ?? 0;

    const longLines = f.content
      .split("\n")
      .filter((l) => l.length > LONG_LINE_THRESHOLD);
    longLineCount += longLines.length;

    jsDocCount += countJsDocComments(f.content);

    // TODO findings (low severity)
    if (todos && todos.length > 0) {
      const lineNum = f.content
        .split("\n")
        .findIndex((l) => TODO_PATTERN.test(l));
      TODO_PATTERN.lastIndex = 0;
      findings.push({
        severity: "low",
        category: "quality",
        title: `${todos.length} TODO/FIXME comment${todos.length > 1 ? "s" : ""} found`,
        description: `${todos.length} unresolved TODO or FIXME comment${todos.length > 1 ? "s were" : " was"} found. These may indicate unfinished work or known issues.`,
        file: f.path,
        line: lineNum >= 0 ? lineNum + 1 : undefined,
        recommendation:
          "Review and resolve or remove TODO/FIXME comments. Track pending work in your issue tracker instead.",
        ruleId: "QUAL-001",
      });
    }
  }

  // ── 3. Security scan ──────────────────────────────────────
  for (const f of sourceFiles) {
    const lines = f.content.split("\n");
    for (const rule of SECURITY_RULES) {
      // Skip console.log rule in test files
      if (rule.id === "SEC-007" && isTestFile(f.path)) continue;

      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          findings.push({
            severity: rule.severity,
            category: "security",
            title: rule.name,
            description: rule.description,
            file: f.path,
            line: i + 1,
            // NEVER include the actual secret value
            evidence: `Suspicious pattern matched on line ${i + 1}. Value redacted for security.`,
            recommendation: rule.recommendation,
            ruleId: rule.id,
          });
          break; // One finding per rule per file
        }
      }
    }
  }

  // ── 4. Complexity analysis ────────────────────────────────
  let complexFunctionCount = 0;

  for (const f of sourceFiles) {
    const complexFuncs = findComplexFunctions(f.path, f.content, 10);
    for (const fn of complexFuncs) {
      complexFunctionCount++;
      const severity: RawFinding["severity"] =
        fn.complexity >= 20 ? "high" : fn.complexity >= 15 ? "medium" : "low";

      findings.push({
        severity,
        category: "complexity",
        title: `High cyclomatic complexity in ${fn.name}()`,
        description: `The function ${fn.name}() has an estimated cyclomatic complexity of ~${fn.complexity}, exceeding the recommended maximum of 10. Complex functions are harder to test, understand, and maintain.`,
        file: f.path,
        line: fn.line,
        evidence: `Estimated complexity: ~${fn.complexity} (threshold: 10)`,
        recommendation:
          "Refactor using early returns, extracted helper functions, or a strategy pattern to reduce branching paths.",
        ruleId: "COMP-001",
      });
    }
  }

  // ── 5. Documentation findings ─────────────────────────────
  if (!readme) {
    findings.push({
      severity: "medium",
      category: "documentation",
      title: "README.md missing",
      description:
        "No README.md was found at the repository root. A README is essential for onboarding contributors and documenting the project.",
      file: "README.md",
      recommendation:
        "Create a README.md describing the project purpose, setup instructions, and usage examples.",
      ruleId: "DOC-001",
    });
  } else if (readme.content.split("\n").length < 10) {
    findings.push({
      severity: "low",
      category: "documentation",
      title: "README.md is very short",
      description:
        "The README.md file is very short and may not provide adequate project documentation.",
      file: "README.md",
      line: 1,
      recommendation:
        "Expand the README with setup instructions, usage examples, and architecture overview.",
      ruleId: "DOC-002",
    });
  }

  // ── 6. Testing findings ───────────────────────────────────
  const testRatio =
    sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 0;

  if (testFiles.length === 0) {
    findings.push({
      severity: "high",
      category: "testing",
      title: "No test files detected",
      description:
        "No test files were found in this repository. Testing is essential for maintaining code quality and preventing regressions.",
      file: "(repository root)",
      recommendation:
        "Add unit tests for core business logic. Aim for a test-to-source file ratio of at least 0.5.",
      ruleId: "TEST-001",
    });
  } else if (testRatio < 0.3) {
    findings.push({
      severity: "medium",
      category: "testing",
      title: "Low test-to-source ratio",
      description: `Only ${testFiles.length} test file${testFiles.length > 1 ? "s" : ""} found for ${sourceFiles.length} source files (ratio: ${(testRatio * 100).toFixed(0)}%). Significant code is likely untested.`,
      file: "(repository root)",
      recommendation:
        "Increase test coverage. Target a test/source ratio of at least 0.5 for critical business logic.",
      ruleId: "TEST-002",
    });
  }

  // ── 7. Large file findings ────────────────────────────────
  for (const f of sourceFiles) {
    const lineCount = f.content.split("\n").length;
    if (lineCount > 500) {
      findings.push({
        severity: "low",
        category: "maintainability",
        title: `Large source file (${lineCount} lines)`,
        description: `${f.path} has ${lineCount} lines. Large files become harder to navigate, test, and maintain.`,
        file: f.path,
        recommendation:
          "Consider splitting this file into smaller, focused modules with clear responsibilities.",
        ruleId: "MAINT-001",
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // Score calculations (all 0–100, deterministic)
  // ──────────────────────────────────────────────────────────

  // CODE QUALITY (0–100)
  // Start at 100, penalize for issues found
  let codeQuality = 100;
  const securityIssues = findings.filter((f) => f.category === "security").length;
  const qualityIssues = findings.filter((f) => f.category === "quality").length;
  codeQuality -= Math.min(30, securityIssues * 8);  // Security issues hurt quality
  codeQuality -= Math.min(20, qualityIssues * 3);   // Quality findings
  codeQuality -= Math.min(20, todoCount * 2);        // TODOs
  codeQuality -= Math.min(15, consoleCount * 1);     // Console logs
  codeQuality -= Math.min(10, longLineCount * 2);    // Long lines
  codeQuality = Math.max(20, Math.round(codeQuality));

  // TESTING (0–100)
  // Based on test-to-source ratio
  let testing: number;
  if (sourceFiles.length === 0) {
    testing = 50; // Can't evaluate
  } else if (testFiles.length === 0) {
    testing = 0;
  } else {
    // ratio 1.0 = 100%, 0.5 = 70%, 0.2 = 40%
    testing = Math.round(Math.min(100, testRatio * 100));
  }

  // DOCUMENTATION (0–100)
  let documentation = 0;
  if (readme) documentation += 40;
  if (readme && readme.content.split("\n").length >= 30) documentation += 20;
  if (hasDocsDir) documentation += 20;
  const jsDocRatio =
    sourceFiles.length > 0 ? jsDocCount / sourceFiles.length : 0;
  documentation += Math.round(Math.min(20, jsDocRatio * 20));
  documentation = Math.max(0, Math.min(100, documentation));

  // COMPLEXITY (0–100)
  // Score decreases as complexity issues increase
  let complexity = 100;
  if (sourceFiles.length > 0) {
    const complexRatio = complexFunctionCount / sourceFiles.length;
    complexity -= Math.round(Math.min(60, complexRatio * 80));
  }
  complexity = Math.max(20, complexity);

  // SECURITY (0–100)
  let security = 100;
  const critSecFindings = findings.filter(
    (f) => f.category === "security" && f.severity === "critical"
  ).length;
  const highSecFindings = findings.filter(
    (f) => f.category === "security" && f.severity === "high"
  ).length;
  const lowSecFindings = findings.filter(
    (f) => f.category === "security" && (f.severity === "medium" || f.severity === "low")
  ).length;
  security -= critSecFindings * 25;
  security -= highSecFindings * 15;
  security -= lowSecFindings * 5;
  security = Math.max(0, Math.min(100, security));

  // MAINTAINABILITY (0–100)
  // Composite: quality + complexity + documentation
  const maintainability = Math.round(
    codeQuality * 0.4 + complexity * 0.35 + documentation * 0.25
  );

  // OVERALL HEALTH SCORE
  // Documented formula:
  //   codeQuality × 0.25
  //   testing     × 0.20
  //   documentation × 0.15
  //   security    × 0.15
  //   maintainability × 0.15
  //   complexity  × 0.10
  const overall = Math.round(
    codeQuality * 0.25 +
    testing * 0.20 +
    documentation * 0.15 +
    security * 0.15 +
    maintainability * 0.15 +
    complexity * 0.10
  );

  return {
    filesAnalyzed: files.length,
    linesOfCode: totalLines,
    metrics: {
      codeQuality,
      testing,
      documentation,
      complexity,
      maintainability,
      security,
      overall,
    },
    findings,
    signals: {
      sourceFiles: sourceFiles.length,
      testFiles: testFiles.length,
      totalLines,
      todoCount,
      consoleCount,
      complexFunctionCount,
      hasReadme: !!readme,
      readmeLengthLines: readme ? readme.content.split("\n").length : 0,
      hasDocsDir,
      securityIssues,
      coverageAvailable: false,
    },
  };
}
