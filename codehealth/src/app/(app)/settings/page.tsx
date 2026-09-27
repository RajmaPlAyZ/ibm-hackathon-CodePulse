"use client";

import { useState } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { useUser, useReverification } from "@clerk/nextjs";
import {
  Settings,
  User,
  FolderGit2,
  BarChart2,
  Bell,
  Sparkles,
  Shield,
  GitBranch,
  Check,
  Loader2,
  Unlink,
} from "lucide-react";

const tabs = [
  { id: "account",       label: "Account",       icon: User },
  { id: "repositories",  label: "Repositories",  icon: FolderGit2 },
  { id: "analysis",      label: "Analysis",      icon: BarChart2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai",            label: "AI Preferences",icon: Sparkles },
  { id: "security",      label: "Security",      icon: Shield },
];

type TabId = typeof tabs[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const { user } = useUser();

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="Settings" subtitle="Manage your CodeHealth preferences." />

      <div className="flex-1 p-6">

        {/* Page title */}
        <div className="fade-up flex items-center gap-3 mb-6">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <Settings className="h-5 w-5" style={{ color: "#7878A0" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}>
              Settings
            </h2>
            <p className="section-label mt-0.5">Configure your workspace preferences</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 fade-up" style={{ animationDelay: "60ms" }}>

          {/* ── Sidebar nav ── */}
          <div
            className="lg:w-52 rounded-2xl p-2 h-fit flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all mb-0.5"
                  style={
                    isActive
                      ? {
                          background: "rgba(20,230,120,0.08)",
                          color: "#14E678",
                          border: "1px solid rgba(20,230,120,0.18)",
                        }
                      : { color: "#7878A0" }
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={isActive ? { color: "#14E678" } : {}} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 space-y-4">
            {activeTab === "account"       && <AccountSettings user={user} />}
            {activeTab === "repositories"  && <RepositoriesSettings />}
            {activeTab === "analysis"      && <AnalysisSettings />}
            {activeTab === "notifications" && <NotificationsSettings />}
            {activeTab === "ai"            && <AISettings />}
            {activeTab === "security"      && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="card-glass rounded-2xl p-5"
    >
      <h3
        className="text-[13px] font-semibold mb-5"
        style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between py-3.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-[13px] font-medium" style={{ color: "#F0F0FF" }}>{label}</p>
        {description && (
          <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#404060" }}>
            {description}
          </p>
        )}
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
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
      style={{
        background: on
          ? "linear-gradient(90deg, #0FCC68, #14E678)"
          : "rgba(255,255,255,0.1)",
        boxShadow: on ? "0 0 10px rgba(20,230,120,0.3)" : "none",
      }}
      aria-checked={on}
      role="switch"
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ── Connected Accounts ────────────────────────────────────────────

function ConnectedAccounts({ user }: { user: ReturnType<typeof useUser>["user"] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const githubAccount = user?.externalAccounts?.find(
    (a) => a.provider.includes("github")
  );

  const createExternalAccountWithReverification = useReverification(async () => {
    if (!user) return;
    const res = await user.createExternalAccount({
      strategy: "oauth_github",
      redirectUrl: "/settings",
    });
    window.location.href = res.verification!.externalVerificationRedirectURL!.href;
  });

  const destroyExternalAccountWithReverification = useReverification(async () => {
    if (!githubAccount) return;
    await githubAccount.destroy();
  });

  async function connectGitHub() {
    setLoading(true);
    setError(null);
    try {
      await createExternalAccountWithReverification();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("cancelled") || msg.includes("canceled")) { setLoading(false); return; }
      if (msg.includes("already connected") || msg.includes("already exists")) { await user?.reload(); setLoading(false); return; }
      setError(msg || "Failed to connect GitHub");
    } finally {
      setLoading(false);
    }
  }

  async function disconnectGitHub() {
    if (!githubAccount) return;
    setLoading(true);
    setError(null);
    try {
      await destroyExternalAccountWithReverification();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("cancelled") || msg.includes("canceled")) { setLoading(false); return; }
      setError(msg || "Failed to disconnect GitHub");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsCard title="Connected Accounts">
      <p className="text-[12px] mb-4" style={{ color: "#7878A0" }}>
        Link your GitHub account to scan private repositories and avoid API rate limits.
      </p>

      {/* GitHub row */}
      <div
        className="flex items-center justify-between py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <GitBranch className="h-4 w-4" style={{ color: "#F0F0FF" }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#F0F0FF" }}>GitHub</p>
            {githubAccount ? (
              <p className="text-[11px] mt-0.5 font-medium flex items-center gap-1" style={{ color: "#14E678" }}>
                <Check className="h-3 w-3" />
                Connected as{" "}
                <span className="font-semibold">
                  {githubAccount.username ?? githubAccount.emailAddress}
                </span>
              </p>
            ) : (
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#404060" }}>
                Not connected
              </p>
            )}
          </div>
        </div>

        {githubAccount ? (
          <button
            onClick={disconnectGitHub}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ border: "1px solid rgba(240,64,96,0.3)", color: "#F04060" }}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
            Disconnect
          </button>
        ) : (
          <button
            onClick={connectGitHub}
            disabled={loading}
            className="btn-primary flex items-center gap-1.5 text-[12px] disabled:opacity-50"
            style={{ padding: "6px 14px" }}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitBranch className="h-3 w-3" />}
            Connect GitHub
          </button>
        )}
      </div>

      {error && (
        <p className="text-[12px] mt-3 font-medium" style={{ color: "#F04060" }}>{error}</p>
      )}

      {!githubAccount && (
        <div
          className="rounded-xl p-3.5 mt-4 flex items-start gap-2.5"
          style={{ background: "rgba(20,230,120,0.05)", border: "1px solid rgba(20,230,120,0.14)" }}
        >
          <GitBranch className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#14E678" }} />
          <p className="text-[12px] font-medium leading-relaxed" style={{ color: "#7878A0" }}>
            Connecting GitHub lets you scan{" "}
            <span style={{ color: "#F0F0FF" }}>private repositories</span> and increases the API
            rate limit from 60 to 5,000 requests/hour.
          </p>
        </div>
      )}
    </SettingsCard>
  );
}

// ── Account Settings ─────────────────────────────────────────────

function AccountSettings({ user }: { user: ReturnType<typeof useUser>["user"] }) {
  return (
    <>
      <ConnectedAccounts user={user} />
      <SettingsCard title="Profile">
        <div
          className="flex items-center gap-4 mb-5 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="avatar" width={56} height={56} className="h-14 w-14 rounded-2xl" />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #0FCC68 0%, #14E678 100%)", color: "#080810" }}
            >
              {user?.firstName?.[0] ?? "D"}
            </div>
          )}
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "#F0F0FF" }}>
              {user?.fullName ?? "Developer"}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "#7878A0" }}>
              {user?.primaryEmailAddress?.emailAddress ?? "—"}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="section-label mb-1.5 block">Display name</label>
            <input
              type="text"
              defaultValue={user?.fullName ?? ""}
              className="input-glass w-full"
            />
          </div>
          <div>
            <label className="section-label mb-1.5 block">Email</label>
            <input
              type="email"
              defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""}
              className="input-glass w-full"
              readOnly
            />
          </div>
          <button className="btn-primary" style={{ marginTop: 4 }}>
            Save Changes
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Danger Zone">
        <SettingsRow
          label="Delete Account"
          description="Permanently delete your account and all associated data. This is irreversible."
        >
          <button
            className="flex-shrink-0 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all hover:bg-red-500/10"
            style={{ border: "1px solid rgba(240,64,96,0.3)", color: "#F04060" }}
          >
            Delete Account
          </button>
        </SettingsRow>
      </SettingsCard>
    </>
  );
}

// ── Repositories Settings ─────────────────────────────────────────

function RepositoriesSettings() {
  const repos = ["ecommerce-platform", "authentication-service", "analytics-api", "mobile-client"];
  return (
    <SettingsCard title="Connected Repositories">
      <p className="text-[12px] mb-4" style={{ color: "#7878A0" }}>
        Manage the repositories connected to your workspace.
      </p>
      {repos.map((repo) => (
        <div
          key={repo}
          className="flex items-center justify-between py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "rgba(20,230,120,0.08)", border: "1px solid rgba(20,230,120,0.15)" }}
            >
              <FolderGit2 className="h-3.5 w-3.5" style={{ color: "#14E678" }} />
            </div>
            <span className="text-[13px] font-medium" style={{ color: "#F0F0FF" }}>{repo}</span>
          </div>
          <button
            className="text-[11px] font-semibold transition-colors hover:text-red-400"
            style={{ color: "#404060" }}
          >
            Remove
          </button>
        </div>
      ))}
    </SettingsCard>
  );
}

// ── Analysis Settings ─────────────────────────────────────────────

function AnalysisSettings() {
  return (
    <SettingsCard title="Analysis Preferences">
      <SettingsRow
        label="Minimum Health Score Threshold"
        description="Alert when health falls below this value."
      >
        <input
          type="number"
          defaultValue={70}
          className="w-20 rounded-xl px-3 py-2 text-[13px] font-semibold text-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "#F0F0FF",
            outline: "none",
          }}
        />
      </SettingsRow>
      <SettingsRow label="Auto-scan on Push" description="Automatically scan when code is pushed.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Analyze Pull Requests" description="Run analysis on new pull requests.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow
        label="Include Dependencies in Scan"
        description="Analyze third-party dependencies."
      >
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}

// ── Notifications Settings ────────────────────────────────────────

function NotificationsSettings() {
  return (
    <SettingsCard title="Notification Preferences">
      <SettingsRow
        label="Critical Findings"
        description="Notify immediately on critical severity findings."
      >
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Scan Completed" description="Notify when a repository scan finishes.">
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow
        label="Health Score Drop"
        description="Notify when health score drops significantly."
      >
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow label="Weekly Summary" description="Receive a weekly health summary email.">
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}

// ── AI Settings ───────────────────────────────────────────────────

function AISettings() {
  return (
    <SettingsCard title="AI Preferences">
      <div
        className="rounded-xl p-3.5 mb-5 flex items-start gap-2.5"
        style={{ background: "rgba(155,126,255,0.06)", border: "1px solid rgba(155,126,255,0.18)" }}
      >
        <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#9B7EFF" }} />
        <p className="text-[12px] font-medium leading-relaxed" style={{ color: "#7878A0" }}>
          AI features are powered by IBM watsonx.ai. Configure your IBM Cloud credentials to enable
          real AI analysis on your repositories.
        </p>
      </div>
      <SettingsRow
        label="AI Explanations"
        description="Show AI-generated explanations for findings."
      >
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow
        label="AI Recommendations"
        description="Generate AI-powered improvement recommendations."
      >
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow
        label="AI Code Review"
        description="Auto-generate code review comments on PRs."
      >
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}

// ── Security Settings ─────────────────────────────────────────────

function SecuritySettings() {
  return (
    <SettingsCard title="Security Preferences">
      <SettingsRow
        label="Secret Detection"
        description="Scan for hardcoded secrets and credentials."
      >
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow
        label="Dependency Vulnerability Scan"
        description="Check dependencies for known CVEs."
      >
        <Toggle defaultChecked={true} />
      </SettingsRow>
      <SettingsRow
        label="Block Merge on Critical"
        description="Block PRs with critical security findings."
      >
        <Toggle defaultChecked={false} />
      </SettingsRow>
    </SettingsCard>
  );
}
