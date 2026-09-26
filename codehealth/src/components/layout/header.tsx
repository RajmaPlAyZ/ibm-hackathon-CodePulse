"use client";

import { Bell, Search, Zap } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { MobileNav } from "./mobile-nav";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <div
      className="flex h-16 items-center justify-between px-6 shrink-0 relative"
      style={{
        background: "#0D0D10",
        borderBottom: "1.5px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <MobileNav />
        </div>
        <div>
          <h1 className="text-base font-black text-white leading-tight tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#4D4D66" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {children}

        {/* Search button */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/8"
          style={{
            border: "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
          }}
          aria-label="Search"
        >
          <Search className="h-4 w-4" style={{ color: "#8B8BA8" }} />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/8"
          style={{
            border: "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
          }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" style={{ color: "#8B8BA8" }} />
          {/* Notification dot */}
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full"
            style={{
              background: "#1DDF6B",
              boxShadow: "0 0 6px #1DDF6B",
              border: "1.5px solid #0D0D10",
            }}
          />
        </button>

        {/* IBM badge */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5"
          style={{
            background: "rgba(167,139,250,0.1)",
            border: "1.5px solid rgba(167,139,250,0.2)",
            boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
          }}
        >
          <Zap className="h-3 w-3" style={{ color: "#A78BFA" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A78BFA" }}>
            IBM watsonx
          </span>
        </div>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </div>
  );
}
