// ============================================================
// Core Domain Types for CodeHealth
// ============================================================

export type Severity = "critical" | "high" | "medium" | "low";
export type ScanStatus = "completed" | "running" | "failed" | "pending";
export type RepositoryStatus = "healthy" | "needs-attention" | "critical";
export type FindingCategory =
  | "security"
  | "quality"
  | "maintainability"
  | "performance"
  | "documentation"
  | "testing"
  | "complexity";
export type FindingStatus = "open" | "resolved" | "ignored";
export type WorkflowStatus = "ready" | "running" | "completed" | "failed";
export type Language =
  | "TypeScript"
  | "JavaScript"
  | "Python"
  | "Java"
  | "Go"
  | "Rust"
  | "Ruby"
  | "Other";

// ============================================================
// User
// ============================================================
export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
}

// ============================================================
// Repository
// ============================================================
export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  language: Language;
  branch: string;
  healthScore: number;
  status: RepositoryStatus;
  lastScanAt?: Date;
  issueCount: number;
  metrics: HealthMetrics;
}

// ============================================================
// Health Metrics
// ============================================================
export interface HealthMetrics {
  codeQuality: number;
  testCoverage: number;
  documentation: number;
  complexity: number;
  security: number;
  maintainability: number;
}

// ============================================================
// Scan
// ============================================================
export interface Scan {
  id: string;
  scanNumber: number;
  repositoryId: string;
  repositoryName: string;
  branch: string;
  status: ScanStatus;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  findingsCount: number;
  healthScore: number;
  stages: ScanStage[];
  currentStage?: string;
  progress?: number;
}

export interface ScanStage {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
}

// ============================================================
// Finding
// ============================================================
export interface Finding {
  id: string;
  repositoryId: string;
  repositoryName: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  description: string;
  file: string;
  line?: number;
  status: FindingStatus;
  detectedAt: Date;
  ruleId?: string;
  codeSnippet?: string;
  aiExplanation?: string;
  recommendedAction?: string;
  suggestedTests?: string[];
  relatedFindingIds?: string[];
}

// ============================================================
// Activity
// ============================================================
export interface Activity {
  id: string;
  type: "scan_completed" | "finding_detected" | "health_improved" | "analysis_done" | "warning";
  message: string;
  timestamp: Date;
  repositoryName?: string;
}

// ============================================================
// AI Types (ready for IBM watsonx.ai integration)
// ============================================================
export interface AIInsight {
  id: string;
  repositoryId: string;
  generatedAt: Date;
  model?: string;
  summary: AIAnalysisSummary;
  recommendations: AIRecommendation[];
}

export interface AIAnalysisSummary {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  priorityAreas: string[];
  confidenceScore?: number;
}

export interface AIRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  problem: string;
  whyItMatters: string;
  suggestedAction: string;
  affectedFiles: string[];
  estimatedEffort: "low" | "medium" | "high";
}

// ============================================================
// Workflow (ready for IBM watsonx Orchestrate)
// ============================================================
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  lastRunAt?: Date;
  nextScheduledAt?: Date;
  estimatedDurationMinutes?: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  durationSeconds?: number;
}

// ============================================================
// History / Trend
// ============================================================
export interface HealthTrendPoint {
  scanId: string;
  scanNumber: number;
  date: Date;
  healthScore: number;
  metrics: HealthMetrics;
}
