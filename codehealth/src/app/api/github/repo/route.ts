import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";

async function getGitHubToken(userId: string | null): Promise<string | undefined> {
  if (!userId) {
    console.log("[github/repo] No userId, using server token");
    return process.env.GITHUB_TOKEN ?? undefined;
  }
  try {
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(userId, "github");
    const tokens = response.data ?? response;
    const token = (tokens as { token?: string; scopes?: string[] }[])[0];
    console.log("[github/repo] Token found:", !!token?.token, "Scopes:", token?.scopes);
    return token?.token ?? process.env.GITHUB_TOKEN ?? undefined;
  } catch (e) {
    console.error("[github/repo] getGitHubToken error:", e);
    return process.env.GITHUB_TOKEN ?? undefined;
  }
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.trim().replace(/\.git$/, "");
    // Handle https://github.com/owner/repo
    const match = cleaned.match(
      /^(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?$/
    );
    if (match) return { owner: match[1], repo: match[2] };
    // Handle owner/repo shorthand
    const short = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (short) return { owner: short[1], repo: short[2] };
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
      { status: 400 }
    );
  }

  // Use the signed-in user's GitHub token if available, fall back to server token
  const { userId } = await auth();
  const githubToken = await getGitHubToken(userId);
  const octokit = new Octokit({ auth: githubToken });

  try {
    // Fetch repo metadata
    const { data: repo } = await octokit.repos.get({
      owner: parsed.owner,
      repo: parsed.repo,
    });

    // Fetch branches (up to 50)
    const { data: branches } = await octokit.repos.listBranches({
      owner: parsed.owner,
      repo: parsed.repo,
      per_page: 50,
    });

    return NextResponse.json({
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ?? "",
      language: repo.language ?? "Unknown",
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      url: repo.html_url,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      branches: branches.map((b) => b.name),
    });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    if (status === 404) {
      return NextResponse.json(
        {
          error:
            "Repository not found. If this is a private repo, make sure you have connected your GitHub account in Settings with repo access.",
        },
        { status: 404 }
      );
    }
    if (status === 403) {
      return NextResponse.json(
        {
          error:
            "Access denied. For private repositories, go to Settings → Account → Connect GitHub to link your account.",
        },
        { status: 403 }
      );
    }
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "GitHub authentication failed. Please disconnect and reconnect your GitHub account in Settings.",
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch repository information from GitHub." },
      { status: 500 }
    );
  }
}
