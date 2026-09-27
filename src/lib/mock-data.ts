import type {
  Repository,
  Scan,
  Finding,
  Activity,
  AIInsight,
  Workflow,
  HealthTrendPoint,
} from "./types";

// ============================================================
// Repositories
// ============================================================
export const mockRepositories: Repository[] = [
  {
    id: "repo-1",
    name: "ecommerce-platform",
    fullName: "my-team/ecommerce-platform",
    description: "Main e-commerce storefront and API",
    language: "TypeScript",
    branch: "main",
    healthScore: 82,
    status: "healthy",
    lastScanAt: new Date(Date.now() - 10 * 60 * 1000),
    issueCount: 17,
    metrics: {
      codeQuality: 86,
      testCoverage: 68,
      documentation: 54,
      complexity: 72,
      security: 88,
      maintainability: 79,
    },
  },
  {
    id: "repo-2",
    name: "authentication-service",
    fullName: "my-team/authentication-service",
    description: "OAuth2 and JWT authentication microservice",
    language: "Java",
    branch: "develop",
    healthScore: 71,
    status: "needs-attention",
    lastScanAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    issueCount: 29,
    metrics: {
      codeQuality: 74,
      testCoverage: 55,
      documentation: 48,
      complexity: 61,
      security: 79,
      maintainability: 68,
    },
  },
  {
    id: "repo-3",
    name: "analytics-api",
    fullName: "my-team/analytics-api",
    description: "Data analytics and reporting REST API",
    language: "Python",
    branch: "main",
    healthScore: 91,
    status: "healthy",
    lastScanAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    issueCount: 8,
    metrics: {
      codeQuality: 93,
      testCoverage: 87,
      documentation: 82,
      complexity: 88,
      security: 95,
      maintainability: 91,
    },
  },
  {
    id: "repo-4",
    name: "mobile-client",
    fullName: "my-team/mobile-client",
    description: "React Native mobile application",
    language: "TypeScript",
    branch: "main",
    healthScore: 64,
    status: "needs-attention",
    lastScanAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    issueCount: 43,
    metrics: {
      codeQuality: 68,
      testCoverage: 42,
      documentation: 39,
      complexity: 58,
      security: 72,
      maintainability: 61,
    },
  },
];

// ============================================================
// Findings
// ============================================================
export const mockFindings: Finding[] = [
  {
    id: "finding-1",
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    severity: "critical",
    category: "security",
    title: "Hardcoded credential detected",
    description:
      "A database password appears to be hardcoded directly in the source file. This poses a significant security risk as the credential may be exposed in version control history.",
    file: "src/config/database.ts",
    line: 18,
    status: "open",
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    ruleId: "SEC-001",
    codeSnippet: `const dbConfig = {
  host: process.env.DB_HOST,
  port: 5432,
  username: 'admin',
  password: 'p@ssw0rd_prod_2024',  // ← hardcoded credential
  database: 'ecommerce_production',
};`,
    aiExplanation:
      "Hardcoded credentials in source code can be exposed through version control history, code reviews, or leaked repositories. Anyone with read access to the repository can extract these credentials.",
    recommendedAction:
      "Move the credential to an environment variable (process.env.DB_PASSWORD) and remove the hardcoded value. Rotate the credential immediately.",
    suggestedTests: [
      "Add a test that verifies DB_PASSWORD is not empty string",
      "Add a linting rule to fail on string literals matching password patterns",
    ],
  },
  {
    id: "finding-2",
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    severity: "high",
    category: "complexity",
    title: "High cyclomatic complexity",
    description:
      "The calculateEligibility() function contains multiple nested decision paths and may be difficult to test and maintain. Cyclomatic complexity score: 24 (threshold: 10).",
    file: "src/services/PaymentService.ts",
    line: 142,
    status: "open",
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    ruleId: "COMP-003",
    codeSnippet: `function calculateEligibility(user: User, order: Order): boolean {
  if (user.tier === 'premium') {
    if (order.total > 1000) {
      if (user.country === 'US') {
        // ... 20 more nested conditions
      }
    }
  }
  return false;
}`,
    aiExplanation:
      "High cyclomatic complexity indicates too many branching paths through a function. This makes the code harder to test, understand, and maintain. Each additional branch exponentially increases the number of test cases needed.",
    recommendedAction:
      "Refactor using early returns, extract sub-conditions into named functions, or use a strategy/rules pattern to eliminate nesting.",
    suggestedTests: [
      "Add unit tests covering all branching paths (minimum 24 test cases)",
      "Add integration test for edge case: user.tier='premium', order.total=999",
    ],
  },
  {
    id: "finding-3",
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    severity: "medium",
    category: "testing",
    title: "Missing test coverage",
    description:
      "The UserService module has 0% test coverage. Critical business logic including user creation, authentication, and profile updates are untested.",
    file: "src/services/UserService.ts",
    line: 87,
    status: "open",
    detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    ruleId: "TEST-002",
  },
  {
    id: "finding-4",
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    severity: "low",
    category: "documentation",
    title: "Missing function documentation",
    description:
      "The AuthController module is missing JSDoc documentation for all public methods. This reduces code discoverability and makes onboarding harder.",
    file: "src/controllers/AuthController.ts",
    line: 31,
    status: "open",
    detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    ruleId: "DOC-001",
  },
  {
    id: "finding-5",
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    severity: "high",
    category: "security",
    title: "SQL injection vulnerability",
    description:
      "User-controlled input is concatenated directly into a SQL query without parameterization or escaping.",
    file: "src/repositories/OrderRepository.ts",
    line: 67,
    status: "open",
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    ruleId: "SEC-002",
  },
  {
    id: "finding-6",
    repositoryId: "repo-2",
    repositoryName: "authentication-service",
    severity: "critical",
    category: "security",
    title: "JWT secret stored in code",
    description: "JWT signing secret is hardcoded in the service configuration.",
    file: "src/config/auth.java",
    line: 24,
    status: "open",
    detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    ruleId: "SEC-001",
  },
  {
    id: "finding-7",
    repositoryId: "repo-2",
    repositoryName: "authentication-service",
    severity: "medium",
    category: "quality",
    title: "Unused imports detected",
    description: "Multiple files contain unused import statements increasing bundle size.",
    file: "src/handlers/TokenHandler.java",
    line: 5,
    status: "open",
    detectedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    ruleId: "QUAL-004",
  },
];

// ============================================================
// Scans
// ============================================================
export const mockScans: Scan[] = [
  {
    id: "scan-1024",
    scanNumber: 1024,
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    branch: "main",
    status: "completed",
    startedAt: new Date(Date.now() - 10 * 60 * 1000),
    completedAt: new Date(Date.now() - 8 * 60 * 1000),
    durationSeconds: 134,
    findingsCount: 17,
    healthScore: 82,
    stages: [
      { name: "Repository scan", status: "completed" },
      { name: "Code quality analysis", status: "completed" },
      { name: "Documentation analysis", status: "completed" },
      { name: "Testing analysis", status: "completed" },
      { name: "Security analysis", status: "completed" },
      { name: "AI analysis", status: "completed" },
    ],
  },
  {
    id: "scan-1023",
    scanNumber: 1023,
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    branch: "main",
    status: "completed",
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 129 * 1000),
    durationSeconds: 129,
    findingsCount: 21,
    healthScore: 76,
    stages: [
      { name: "Repository scan", status: "completed" },
      { name: "Code quality analysis", status: "completed" },
      { name: "Documentation analysis", status: "completed" },
      { name: "Testing analysis", status: "completed" },
      { name: "Security analysis", status: "completed" },
      { name: "AI analysis", status: "completed" },
    ],
  },
  {
    id: "scan-1022",
    scanNumber: 1022,
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    branch: "main",
    status: "completed",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 148 * 1000),
    durationSeconds: 148,
    findingsCount: 25,
    healthScore: 73,
    stages: [
      { name: "Repository scan", status: "completed" },
      { name: "Code quality analysis", status: "completed" },
      { name: "Documentation analysis", status: "completed" },
      { name: "Testing analysis", status: "completed" },
      { name: "Security analysis", status: "completed" },
      { name: "AI analysis", status: "completed" },
    ],
  },
  {
    id: "scan-1021",
    scanNumber: 1021,
    repositoryId: "repo-1",
    repositoryName: "ecommerce-platform",
    branch: "develop",
    status: "failed",
    startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    durationSeconds: 45,
    findingsCount: 0,
    healthScore: 0,
    stages: [
      { name: "Repository scan", status: "completed" },
      { name: "Code quality analysis", status: "failed" },
      { name: "Documentation analysis", status: "pending" },
      { name: "Testing analysis", status: "pending" },
      { name: "Security analysis", status: "pending" },
      { name: "AI analysis", status: "pending" },
    ],
  },
  {
    id: "scan-1020",
    scanNumber: 1020,
    repositoryId: "repo-2",
    repositoryName: "authentication-service",
    branch: "develop",
    status: "completed",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 118 * 1000),
    durationSeconds: 118,
    findingsCount: 29,
    healthScore: 71,
    stages: [
      { name: "Repository scan", status: "completed" },
      { name: "Code quality analysis", status: "completed" },
      { name: "Documentation analysis", status: "completed" },
      { name: "Testing analysis", status: "completed" },
      { name: "Security analysis", status: "completed" },
      { name: "AI analysis", status: "completed" },
    ],
  },
];

// A mock running scan (used to demonstrate progress UI)
export const mockRunningScan: Scan = {
  id: "scan-1025",
  scanNumber: 1025,
  repositoryId: "repo-1",
  repositoryName: "ecommerce-platform",
  branch: "main",
  status: "running",
  startedAt: new Date(),
  findingsCount: 0,
  healthScore: 0,
  progress: 78,
  currentStage: "Testing analysis",
  stages: [
    { name: "Repository scan", status: "completed" },
    { name: "Code quality analysis", status: "completed" },
    { name: "Documentation analysis", status: "completed" },
    { name: "Testing analysis", status: "running" },
    { name: "Security analysis", status: "pending" },
    { name: "AI analysis", status: "pending" },
  ],
};

// ============================================================
// Activity
// ============================================================
export const mockActivity: Activity[] = [
  {
    id: "act-1",
    type: "scan_completed",
    message: "Repository scan completed",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    repositoryName: "ecommerce-platform",
  },
  {
    id: "act-2",
    type: "analysis_done",
    message: "14 tests analyzed",
    timestamp: new Date(Date.now() - 11 * 60 * 1000),
    repositoryName: "ecommerce-platform",
  },
  {
    id: "act-3",
    type: "warning",
    message: "3 security findings detected",
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    repositoryName: "ecommerce-platform",
  },
  {
    id: "act-4",
    type: "analysis_done",
    message: "Documentation analysis completed",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    repositoryName: "ecommerce-platform",
  },
  {
    id: "act-5",
    type: "health_improved",
    message: "Health score increased from 76 → 82",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    repositoryName: "ecommerce-platform",
  },
];

// ============================================================
// AI Insights
// ============================================================
export const mockAIInsight: AIInsight = {
  id: "ai-insight-1",
  repositoryId: "repo-1",
  generatedAt: new Date(Date.now() - 10 * 60 * 1000),
  model: "watsonx.ai (placeholder)",
  summary: {
    overallAssessment:
      "Your repository is generally healthy, but testing and documentation are the two largest improvement opportunities. The security findings require immediate attention before the next release.",
    strengths: [
      "Strong code quality score (86%)",
      "Good security posture overall (88%)",
      "Consistent commit history and branch hygiene",
    ],
    weaknesses: [
      "Test coverage at 68% — below recommended 80% threshold",
      "Documentation at 54% — many public APIs lack JSDoc",
      "3 complexity hotspots in payment processing logic",
    ],
    priorityAreas: [
      "Resolve critical hardcoded credential in database.ts",
      "Increase test coverage in PaymentService and UserService",
      "Refactor 3 high-complexity functions",
    ],
    confidenceScore: 0.87,
  },
  recommendations: [
    {
      id: "rec-1",
      priority: "critical",
      problem: "Hardcoded credential in database configuration",
      whyItMatters:
        "Exposed credentials can lead to unauthorized database access, data breaches, and compliance violations.",
      suggestedAction:
        "Immediately rotate the exposed credential, move all secrets to environment variables, and add a secrets scanning step to CI/CD.",
      affectedFiles: ["src/config/database.ts"],
      estimatedEffort: "low",
    },
    {
      id: "rec-2",
      priority: "high",
      problem: "Insufficient test coverage in PaymentService",
      whyItMatters:
        "Payment logic is business-critical. Low test coverage increases the risk of undetected regressions in production.",
      suggestedAction:
        "Add unit tests for calculateEligibility(), processRefund(), and validateCard() functions. Target 85%+ coverage.",
      affectedFiles: [
        "src/services/PaymentService.ts",
        "src/services/PaymentService.test.ts",
      ],
      estimatedEffort: "medium",
    },
    {
      id: "rec-3",
      priority: "high",
      problem: "3 functions with cyclomatic complexity > 15",
      whyItMatters:
        "High complexity functions are harder to test, more prone to bugs, and slow to onboard new developers.",
      suggestedAction:
        "Refactor calculateEligibility(), processOrder(), and validateCheckout() using early returns and extracted helper functions.",
      affectedFiles: [
        "src/services/PaymentService.ts",
        "src/services/OrderService.ts",
      ],
      estimatedEffort: "medium",
    },
    {
      id: "rec-4",
      priority: "medium",
      problem: "Public API methods lack JSDoc documentation",
      whyItMatters:
        "Missing documentation slows down onboarding and makes it harder for IDE tooling to provide useful hints.",
      suggestedAction:
        "Add JSDoc comments to all exported functions in AuthController, UserService, and OrderService.",
      affectedFiles: [
        "src/controllers/AuthController.ts",
        "src/services/UserService.ts",
        "src/services/OrderService.ts",
      ],
      estimatedEffort: "low",
    },
  ],
};

// ============================================================
// Workflows
// ============================================================
export const mockWorkflows: Workflow[] = [
  {
    id: "wf-1",
    name: "Code Health Analysis",
    description:
      "Full end-to-end codebase health analysis including AI-powered recommendations.",
    status: "ready",
    estimatedDurationMinutes: 5,
    steps: [
      { id: "s1", name: "Repository Scan", description: "Clone and index repository", status: "pending" },
      { id: "s2", name: "Code Quality", description: "Analyze code quality metrics", status: "pending" },
      { id: "s3", name: "Testing", description: "Measure test coverage", status: "pending" },
      { id: "s4", name: "Documentation", description: "Check documentation completeness", status: "pending" },
      { id: "s5", name: "Security", description: "Run security vulnerability scans", status: "pending" },
      { id: "s6", name: "AI Analysis", description: "Generate AI insights via watsonx.ai", status: "pending" },
      { id: "s7", name: "Health Report", description: "Compile and publish report", status: "pending" },
    ],
  },
  {
    id: "wf-2",
    name: "Pull Request Review",
    description:
      "Automatically analyze pull requests for quality, security, and test coverage regressions.",
    status: "ready",
    estimatedDurationMinutes: 3,
    steps: [
      { id: "s1", name: "Diff Analysis", description: "Analyze changed files", status: "pending" },
      { id: "s2", name: "Quality Check", description: "Check quality metrics for changes", status: "pending" },
      { id: "s3", name: "Security Scan", description: "Scan changes for vulnerabilities", status: "pending" },
      { id: "s4", name: "Coverage Impact", description: "Calculate test coverage impact", status: "pending" },
      { id: "s5", name: "AI Review", description: "Generate AI review comments", status: "pending" },
      { id: "s6", name: "PR Comment", description: "Post review summary to PR", status: "pending" },
    ],
  },
  {
    id: "wf-3",
    name: "Release Readiness Check",
    description:
      "Comprehensive pre-release validation ensuring code meets quality and security thresholds.",
    status: "ready",
    estimatedDurationMinutes: 8,
    steps: [
      { id: "s1", name: "Full Health Scan", description: "Complete repository health analysis", status: "pending" },
      { id: "s2", name: "Security Audit", description: "Deep security vulnerability audit", status: "pending" },
      { id: "s3", name: "Coverage Gate", description: "Enforce minimum test coverage", status: "pending" },
      { id: "s4", name: "Dependency Audit", description: "Check for vulnerable dependencies", status: "pending" },
      { id: "s5", name: "Breaking Change Detection", description: "Detect API breaking changes", status: "pending" },
      { id: "s6", name: "Release Report", description: "Generate release readiness report", status: "pending" },
    ],
  },
];

// ============================================================
// Health Trend History
// ============================================================
export const mockHealthTrend: HealthTrendPoint[] = [
  {
    scanId: "scan-1019",
    scanNumber: 1019,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    healthScore: 68,
    metrics: { codeQuality: 72, testCoverage: 55, documentation: 42, complexity: 60, security: 80, maintainability: 65 },
  },
  {
    scanId: "scan-1020",
    scanNumber: 1020,
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    healthScore: 71,
    metrics: { codeQuality: 75, testCoverage: 58, documentation: 44, complexity: 63, security: 82, maintainability: 67 },
  },
  {
    scanId: "scan-1021",
    scanNumber: 1021,
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    healthScore: 73,
    metrics: { codeQuality: 78, testCoverage: 60, documentation: 46, complexity: 65, security: 83, maintainability: 70 },
  },
  {
    scanId: "scan-1022",
    scanNumber: 1022,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    healthScore: 76,
    metrics: { codeQuality: 82, testCoverage: 62, documentation: 49, complexity: 68, security: 85, maintainability: 74 },
  },
  {
    scanId: "scan-1023",
    scanNumber: 1023,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    healthScore: 79,
    metrics: { codeQuality: 84, testCoverage: 65, documentation: 51, complexity: 70, security: 87, maintainability: 77 },
  },
  {
    scanId: "scan-1024",
    scanNumber: 1024,
    date: new Date(),
    healthScore: 82,
    metrics: { codeQuality: 86, testCoverage: 68, documentation: 54, complexity: 72, security: 88, maintainability: 79 },
  },
];
