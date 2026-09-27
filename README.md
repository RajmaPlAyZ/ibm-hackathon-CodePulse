# CodeHealth

> AI-powered codebase health analysis for modern development teams.

CodeHealth is a developer-focused platform that analyzes GitHub repositories and turns codebase signals into a clear, actionable **Code Health Score**.

Instead of relying on intuition or manually reviewing dozens of files, CodeHealth brings code quality, testing, documentation, security, maintainability, and complexity signals into a single dashboard.

The platform combines **deterministic static analysis** with **IBM watsonx.ai** to explain findings and recommend practical improvements.

---

## 🚀 Why CodeHealth?

As codebases grow, developers often struggle to answer simple but important questions:

- Is this repository healthy?
- Where are the biggest technical risks?
- Are we accumulating technical debt?
- Is test coverage improving or declining?
- Which issues should developers address first?
- Is the codebase ready for a release?

Existing tools often provide large amounts of raw information without giving developers a simple way to understand the overall state of their codebase.

**CodeHealth solves this by turning repository analysis into an understandable health dashboard.**

---

## ✨ Features

### 📊 Code Health Dashboard

Get an at-a-glance view of repository health.

Key metrics include:

- Overall Health Score
- Code Quality
- Test Coverage
- Documentation
- Security
- Maintainability
- Complexity
- Open Findings
- Health Trends

---

### 🔗 GitHub Repository Integration

Connect a GitHub repository and analyze its source code.

CodeHealth supports:

- Public repositories
- Private repositories with appropriate GitHub access
- Branch selection
- Repository metadata
- Recursive source-file analysis

Supported languages include:

- TypeScript
- JavaScript
- TSX / JSX
- Python
- Java
- Go

---

### 🔍 Repository Scanning

CodeHealth performs deterministic repository analysis.

The scanner evaluates signals such as:

- Code quality
- Test presence
- Test coverage when real coverage data is available
- Documentation
- Complexity
- Maintainability
- Security-related patterns
- Source-code structure

The scanner intentionally avoids fabricating metrics.

If reliable data is unavailable, CodeHealth reports that limitation rather than inventing a value.

---

### 🚨 Findings

Detected issues are organized by severity:

- Critical
- High
- Medium
- Low

Each finding can include:

- Title
- Description
- Severity
- File
- Location
- Category
- Recommended action

This allows developers to move from:

> "My codebase has problems."

to:

> "These are the specific files and issues I should address."

---

### 🤖 AI Insights

CodeHealth uses **IBM watsonx.ai** to interpret deterministic scan results.

The AI layer is designed to:

- Explain the current codebase health
- Identify important improvement areas
- Prioritize findings
- Explain why issues matter
- Recommend practical actions
- Generate a developer-friendly summary

The AI does **not** replace the deterministic scanner.

Instead:

```text
GitHub Repository
       ↓
Repository Scanner
       ↓
Deterministic Metrics & Findings
       ↓
AI Context Builder
       ↓
IBM watsonx.ai
       ↓
AI Insights
