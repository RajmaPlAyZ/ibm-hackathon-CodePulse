import { SignUp } from "@clerk/nextjs";
import { Activity } from "lucide-react";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0B0B0C" }}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          >
            <Activity className="h-7 w-7" style={{ color: "#22C55E" }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">CodeHealth</h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Understand your codebase. Improve it with confidence.
            </p>
          </div>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[#151516] border border-white/8 shadow-2xl rounded-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              formFieldLabel: "text-gray-300 text-sm",
              formFieldInput:
                "bg-[#1D1D1F] border-white/10 text-white placeholder:text-gray-500 rounded-xl",
              formButtonPrimary:
                "bg-green-500 hover:bg-green-600 text-black font-semibold rounded-xl",
              footerActionLink: "text-green-400 hover:text-green-300",
              dividerLine: "bg-white/10",
              dividerText: "text-gray-500",
              socialButtonsBlockButton:
                "bg-[#1D1D1F] border-white/10 text-white hover:bg-white/8 rounded-xl",
              socialButtonsBlockButtonText: "text-white",
            },
          }}
        />
      </div>
    </div>
  );
}
