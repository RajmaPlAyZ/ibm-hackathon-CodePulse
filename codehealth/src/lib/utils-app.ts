import type { Severity, RepositoryStatus, ScanStatus, FindingStatus } from "./types";

export function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function formatDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "critical": return "text-red-400";
    case "high": return "text-orange-400";
    case "medium": return "text-yellow-400";
    case "low": return "text-blue-400";
  }
}

export function getSeverityBg(severity: Severity): string {
  switch (severity) {
    case "critical": return "bg-red-500/15 text-red-400 border border-red-500/20";
    case "high": return "bg-orange-500/15 text-orange-400 border border-orange-500/20";
    case "medium": return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";
    case "low": return "bg-blue-500/15 text-blue-400 border border-blue-500/20";
  }
}

export function getHealthColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

export function getHealthTextColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export function getRepositoryStatusBadge(status: RepositoryStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "healthy":
      return { label: "Healthy", className: "bg-green-500/15 text-green-400 border border-green-500/20" };
    case "needs-attention":
      return { label: "Needs Attention", className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" };
    case "critical":
      return { label: "Critical", className: "bg-red-500/15 text-red-400 border border-red-500/20" };
  }
}

export function getScanStatusBadge(status: ScanStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "completed":
      return { label: "Completed", className: "bg-green-500/15 text-green-400 border border-green-500/20" };
    case "running":
      return { label: "Running", className: "bg-blue-500/15 text-blue-400 border border-blue-500/20" };
    case "failed":
      return { label: "Failed", className: "bg-red-500/15 text-red-400 border border-red-500/20" };
    case "pending":
      return { label: "Pending", className: "bg-gray-500/15 text-gray-400 border border-gray-500/20" };
  }
}

export function getFindingStatusBadge(status: FindingStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "open":
      return { label: "Open", className: "bg-orange-500/15 text-orange-400 border border-orange-500/20" };
    case "resolved":
      return { label: "Resolved", className: "bg-green-500/15 text-green-400 border border-green-500/20" };
    case "ignored":
      return { label: "Ignored", className: "bg-gray-500/15 text-gray-400 border border-gray-500/20" };
  }
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: "#3178C6",
    JavaScript: "#F7DF1E",
    Python: "#3776AB",
    Java: "#ED8B00",
    Go: "#00ADD8",
    Rust: "#CE422B",
    Ruby: "#CC342D",
  };
  return colors[language] ?? "#6B7280";
}

export function greetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
