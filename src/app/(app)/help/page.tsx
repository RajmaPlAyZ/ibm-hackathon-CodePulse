"use client";

import { Header } from "@/components/layout/header";
import {
  BookOpen,
  MessageSquare,
  ExternalLink,
  HelpCircle,
  Zap,
  GitBranch,
  Shield,
  Activity,
  ChevronRight,
  Mail,
} from "lucide-react";

const docLinks = [
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "Learn about CodeHealth features and how to configure your repositories for analysis.",
    color: "#14E678",
    glow: "rgba(20,230,120,0.12)",
    border: "rgba(20,230,120,0.18)",
    tag: "Guides",
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    desc: "Connect public and private repositories. Increase API limits by linking your GitHub account.",
    color: "#4D9EFF",
    glow: "rgba(77,158,255,0.12)",
    border: "rgba(77,158,255,0.18)",
    tag: "Integration",
  },
  {
    icon: Zap,
    title: "IBM watsonx.ai",
    desc: "Unlock AI-powered explanations, recommendations, and automated refactoring with watsonx.ai.",
    color: "#9B7EFF",
    glow: "rgba(155,126,255,0.12)",
    border: "rgba(155,126,255,0.18)",
    tag: "AI",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    desc: "CodeHealth never stores your source code. Analysis runs in-memory and only metadata is saved.",
    color: "#F5A623",
    glow: "rgba(245,166,35,0.12)",
    border: "rgba(245,166,35,0.18)",
    tag: "Security",
  },
];

const supportLinks = [
  {
    icon: MessageSquare,
    title: "Support Chat",
    desc: "Get help from our support team for any issues you encounter.",
    color: "#4D9EFF",
  },
  {
    icon: ExternalLink,
    title: "GitHub Repository",
    desc: "View the source code, report bugs, and contribute to CodeHealth.",
    color: "#9B7EFF",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "Reach us at support@codehealth.io for enterprise and billing questions.",
    color: "#14E678",
  },
];

const faqs = [
  {
    q: "How does the health score work?",
    a: "The score is computed from 6 weighted metrics: code quality, test coverage, documentation, complexity, security, and maintainability. Each is scored 0–100 and combined into an overall health score.",
  },
  {
    q: "Can I scan private repositories?",
    a: "Yes. Connect your GitHub account in Settings → Account. This grants a personal OAuth token with repo scope, allowing CodeHealth to fetch your private repos.",
  },
  {
    q: "How long does a scan take?",
    a: "Most scans complete in 30–120 seconds depending on repository size. Large monorepos with thousands of files may take up to 3 minutes.",
  },
  {
    q: "Is my source code stored anywhere?",
    a: "No. CodeHealth fetches files temporarily for analysis. Only the resulting metrics, scores, and findings are stored in the database — never raw source code.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="Help & Documentation" subtitle="Get support and learn how to use CodeHealth." />

      <div className="flex-1 p-6 space-y-8 max-w-4xl">

        {/* ── Page title ── */}
        <div className="fade-up flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
            style={{
              background: "rgba(20,230,120,0.10)",
              border: "1px solid rgba(20,230,120,0.2)",
              boxShadow: "0 0 16px rgba(20,230,120,0.06)",
            }}
          >
            <HelpCircle className="h-5 w-5" style={{ color: "#14E678" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}>
              Help & Docs
            </h2>
            <p className="section-label mt-0.5">Everything you need to get started</p>
          </div>
        </div>

        {/* ── Documentation grid ── */}
        <div className="fade-up" style={{ animationDelay: "40ms" }}>
          <p className="section-label mb-4">Documentation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docLinks.map(({ icon: Icon, title, desc, color, glow, border, tag }, i) => (
              <button
                key={title}
                className="group text-left flex items-start gap-4 rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${glow} 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${border}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                  animationDelay: `${40 + i * 40}ms`,
                }}
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: glow, border: `1px solid ${border}` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
                      {title}
                    </p>
                    <span
                      className="badge-pill text-[9px]"
                      style={{ background: glow, color, borderColor: border }}
                    >
                      {tag}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: "#7878A0" }}>{desc}</p>
                </div>
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <p className="section-label mb-4">Frequently Asked Questions</p>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div
                key={i}
                className="card-glass p-5"
                style={{ animationDelay: `${120 + i * 40}ms` }}
              >
                <p
                  className="text-[13px] font-semibold mb-2"
                  style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
                >
                  {q}
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: "#7878A0" }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Support links ── */}
        <div className="fade-up" style={{ animationDelay: "200ms" }}>
          <p className="section-label mb-4">Support</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportLinks.map(({ icon: Icon, title, desc, color }) => (
              <button
                key={title}
                className="group text-left card-glass flex items-start gap-3 p-4 transition-all duration-200 hover:scale-[1.02]"
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}14`, border: `1px solid ${color}28` }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color, width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
                    {title}
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#7878A0" }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── IBM Hackathon badge ── */}
        <div className="fade-up card-glass-green p-5 flex items-center gap-4" style={{ animationDelay: "240ms" }}>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0A9B50 0%, #14E678 100%)",
              boxShadow: "0 0 20px rgba(20,230,120,0.25)",
            }}
          >
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
              IBM Hackathon Project
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "#7878A0" }}>
              CodeHealth is built for the IBM Hackathon. Source code is available on GitHub. For questions,
              reach out via the Hackathon Slack workspace.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
