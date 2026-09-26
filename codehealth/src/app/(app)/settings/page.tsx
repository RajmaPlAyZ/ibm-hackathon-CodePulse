"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useUser } from "@clerk/nextjs";
import { Settings, User, FolderGit2, BarChart2, Bell, Sparkles, Shield, ChevronRight } from "lucide-react";

const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "repositories", label: "Repositories", icon: FolderGit2 },
  { id: "analysis", label: "Analysis", icon: BarChart2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai", label: "AI Preferences", icon: Sparkles },
  { id: "security", label: "Security", icon: Shield },
];

type TabId = typeof tabs[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const { user } = useUser();

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title="Settings" subtitle="Manage your CodeHealth preferences." />

      <div className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>Configure your workspace preferences</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Sidebar tabs */}
          <div
            className="lg:w-52 rounded-2xl p-2 h-fit"
            style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                  style={
                    isActive
                      ? { background: "rgba(34,197,94,0.12)", color: "#fff" }
                      : { color: "#6B7280" }
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={isActive ? { color: "#22C55E" } : {}} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {activeTab === "account" && (
              <AccountSettings user={user} />
            )}
            {activeTab === "repositories" && <RepositoriesSettings />}
            {activeTab === "analysis" && <AnalysisSettings />}
            {activeTab === "notifications" && <NotificationsSettings />}
            {activeTab === "ai" && <AISettings />}
            {activeTab === "security" && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{ background: on ? "#22C55E" : "rgba(255,255,255,0.12)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function AccountSettings({ user }: { user: ReturnType<typeof useUser>["user"] }) {
  return (
    <>
      <SettingsCard title="Profile">
        <div className="flex items-center gap-4 mb-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="avatar" className="h-14 w-14 rounded-full" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: "#22C55E" }}>
              {user?.firstName?.[0] ?? "D"}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{user?.fullName ?? "Developer"}</p>
            <p className="text-sm" style={{ color: "#6B7280" }}>{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#6B7280" }}>Display name</label>
            <input
              type="text"
              defaultValue={user?.fullName ?? ""}
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: "#1D1D1F", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "#6B7280" }}>Email</label>
            <input
              type="email"
              defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""}
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: "#1D1D1F", border: "1px solid rgba(255,255,255,0.08)" }}
              readOnly
            />
          </div>
          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#22C55E", color: "#0B0B0C" }}
          >
            Save Changes
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Danger Zone">
        <SettingsRow label="Delete Account" description="Permanently delete your account and all data.">
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}
          >
            Delete Account
          </button>
        </SettingsRow>
      </SettingsCard>
    </>
  );
}

function RepositoriesSettings() {
  return (
    <SettingsCard title="Connected Repositories">
      {["ecommerce-platform", "authentication-service", "analytics-api", "mobile-client"].map((repo) => (
        <div
          key={repo}
          className="flex items-center justify-between py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" style={{ color: "#22C55E" }} />
            <span className="text-sm font-medium text-white">{repo}</span>
          </div>
          <button className="text-xs" style={{ color: "#6B7280" }}>Remove</button>
        </div>
      ))}
    </SettingsCard>
  );
}

function AnalysisSettings() {
  return (
    <SettingsCard title="Analysis Preferences">
      <SettingsRow label="Minimum Health Score Threshold" description="Alert when health falls below this value.">
        <input
          type="number"
          defaultValue={70}
          className="w-20 rounded-xl px-3 py-2 text-sm text-white outline-none text-center"
          style={{ background: "#1D1D1F", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </SettingsRow>
      <SettingsRow label="Auto-scan on Push" description="Automatically scan when code is pushed.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Analyze Pull Requests" description="Run analysis on new pull requests.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Include Dependencies in Scan" description="Analyze third-party dependencies.">
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}

function NotificationsSettings() {
  return (
    <SettingsCard title="Notification Preferences">
      <SettingsRow label="Critical Findings" description="Notify immediately on critical severity findings.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Scan Completed" description="Notify when a repository scan finishes.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Health Score Drop" description="Notify when health score drops significantly.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Weekly Summary" description="Receive a weekly health summary email.">
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}

function AISettings() {
  return (
    <SettingsCard title="AI Preferences">
      <div
        className="rounded-xl p-3 mb-4 flex items-start gap-2"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#8B5CF6" }} />
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          AI features will be powered by IBM watsonx.ai. Configure your IBM Cloud credentials to enable real AI analysis.
        </p>
      </div>
      <SettingsRow label="AI Explanations" description="Show AI-generated explanations for findings.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="AI Recommendations" description="Generate AI-powered improvement recommendations.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="AI Code Review" description="Auto-generate code review comments on PRs.">
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}

function SecuritySettings() {
  return (
    <SettingsCard title="Security Preferences">
      <SettingsRow label="Secret Detection" description="Scan for hardcoded secrets and credentials.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Dependency Vulnerability Scan" description="Check dependencies for known CVEs.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Block Merge on Critical" description="Block PRs with critical security findings.">
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}
