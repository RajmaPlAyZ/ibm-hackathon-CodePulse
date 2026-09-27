/**
 * GET /api/debug-watsonx
 *
 * Diagnostic endpoint — shows whether OpenRouter env vars are loaded
 * in the running Next.js process. NEVER exposes actual key values.
 * Delete this file after debugging.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  const model  = process.env.OPENROUTER_MODEL ?? "";

  return NextResponse.json({
    OPENROUTER_API_KEY: apiKey
      ? `SET  (length=${apiKey.trim().length}, starts=${apiKey.trim().slice(0, 4)}...)`
      : "MISSING",
    OPENROUTER_MODEL: model
      ? `SET  → ${model}`
      : "empty → will default to nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
    node_version: process.version,
  });
}
