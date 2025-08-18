import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type GitHubEnvConfig = {
  enabled: boolean;
  token: string;
  owner: string;
  repo: string;
};

function getEnvConfig(): GitHubEnvConfig {
  // Preferir variables de entorno del servidor (no públicas). Mantener compatibilidad temporal con NEXT_PUBLIC_* si existen.
  const enabled =
    (process.env.GITHUB_SYNC_ENABLED ?? process.env.NEXT_PUBLIC_GITHUB_SYNC_ENABLED) === 'true';
  const token = process.env.GITHUB_TOKEN ?? process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? '';
  const owner = process.env.GITHUB_OWNER ?? process.env.NEXT_PUBLIC_GITHUB_OWNER ?? '';
  const repo = process.env.GITHUB_REPO ?? process.env.NEXT_PUBLIC_GITHUB_REPO ?? '';

  return { enabled, token, owner, repo };
}

async function githubRequest(
  endpoint: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  const url = `https://api.github.com${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'FlowDocs-Server',
    'Content-Type': 'application/json',
  };
  return fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers as Record<string, string>),
    },
  });
}

export async function GET() {
  const cfg = getEnvConfig();

  // Respuesta rápida si no está habilitado
  if (!cfg.enabled) {
    return NextResponse.json(
      {
        ok: false,
        enabled: false,
        hasAuth: !!cfg.token,
        hasRepo: !!(cfg.owner && cfg.repo),
        message: 'GitHub sync disabled via env (GITHUB_SYNC_ENABLED=false)',
      },
      { status: 200 }
    );
  }

  // Validar configuración mínima
  if (!cfg.token) {
    return NextResponse.json(
      {
        ok: false,
        enabled: cfg.enabled,
        hasAuth: false,
        hasRepo: !!(cfg.owner && cfg.repo),
        message: 'Missing GitHub token (GITHUB_TOKEN)',
      },
      { status: 200 }
    );
  }

  if (!cfg.owner || !cfg.repo) {
    return NextResponse.json(
      {
        ok: false,
        enabled: cfg.enabled,
        hasAuth: true,
        hasRepo: false,
        message: 'Missing GitHub owner/repo (GITHUB_OWNER/GITHUB_REPO)',
      },
      { status: 200 }
    );
  }

  try {
    // 1) Probar autenticación
    const userRes = await githubRequest('/user', cfg.token);
    const rateLimitRemaining = Number(userRes.headers.get('x-ratelimit-remaining') ?? '0');
    const rateLimitReset = Number(userRes.headers.get('x-ratelimit-reset') ?? '0');

    if (!userRes.ok) {
      const text = await userRes.text();
      return NextResponse.json(
        {
          ok: false,
          enabled: cfg.enabled,
          hasAuth: false,
          hasRepo: true,
          message: `GitHub auth failed: ${userRes.status}`,
          detail: text,
          rateLimitRemaining,
          rateLimitReset,
        },
        { status: 200 }
      );
    }

    const user = await userRes.json();

    // 2) Probar acceso al repo
    const repoRes = await githubRequest(`/repos/${cfg.owner}/${cfg.repo}`, cfg.token);
    const repoRateRemaining = Number(repoRes.headers.get('x-ratelimit-remaining') ?? '0');
    const repoRateReset = Number(repoRes.headers.get('x-ratelimit-reset') ?? '0');

    if (!repoRes.ok) {
      const text = await repoRes.text();
      return NextResponse.json(
        {
          ok: false,
          enabled: cfg.enabled,
          hasAuth: true,
          hasRepo: true,
          message: `Cannot access repository ${cfg.owner}/${cfg.repo}: ${repoRes.status}`,
          detail: text,
          rateLimitRemaining: repoRateRemaining,
          rateLimitReset: repoRateReset,
          user: {
            login: user?.login,
            id: user?.id,
          },
        },
        { status: 200 }
      );
    }

    const repoInfo = await repoRes.json();

    return NextResponse.json(
      {
        ok: true,
        enabled: cfg.enabled,
        hasAuth: true,
        hasRepo: true,
        user: {
          login: user?.login,
          id: user?.id,
        },
        repository: {
          full_name: repoInfo?.full_name,
          private: repoInfo?.private,
          default_branch: repoInfo?.default_branch,
          html_url: repoInfo?.html_url,
        },
        rateLimitRemaining: Math.min(rateLimitRemaining, repoRateRemaining),
        rateLimitReset: Math.max(rateLimitReset, repoRateReset),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        enabled: cfg.enabled,
        hasAuth: !!cfg.token,
        hasRepo: !!(cfg.owner && cfg.repo),
        message: 'Unexpected error testing GitHub connection',
        error: error?.message ?? String(error),
      },
      { status: 200 }
    );
  }
}