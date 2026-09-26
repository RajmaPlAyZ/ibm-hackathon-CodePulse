import { Header } from "@/components/layout/header";
import { HelpCircle, BookOpen, MessageSquare, ExternalLink } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title="Help & Documentation" subtitle="Get support and learn how to use CodeHealth." />
      <div className="flex-1 p-6">
        <div className="max-w-2xl space-y-4">
          {[
            { icon: BookOpen, title: "Documentation", desc: "Learn about CodeHealth features and how to configure your repositories.", color: "#22C55E" },
            { icon: MessageSquare, title: "Support Chat", desc: "Get help from our support team for any issues you encounter.", color: "#3B82F6" },
            { icon: ExternalLink, title: "GitHub Repository", desc: "View the source code, report bugs, and contribute to CodeHealth.", color: "#8B5CF6" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl p-5 cursor-pointer transition-all hover:border-white/12"
              style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                <p className="text-sm" style={{ color: "#6B7280" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
