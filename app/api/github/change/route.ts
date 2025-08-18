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
  const enabled =
    (process.env.GITHUB_SYNC_ENABLED ?? process.env.NEXT_PUBLIC_GITHUB_SYNC_ENABLED) === 'true';
  const token = process.env.GITHUB_TOKEN ?? process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? '';
  const owner = process.env.GITHUB_OWNER ?? process.env.NEXT_PUBLIC_GITHUB_OWNER ?? '';
  const repo = process.env.GITHUB_REPO ?? process.env.NEXT_PUBLIC_GITHUB_REPO ?? '';
  return { enabled, token, owner, repo };
}

const GITHUB_BASE = 'https://api.github.com';

async function githubRequest(
  endpoint: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${GITHUB_BASE}${endpoint}`;
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

async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  token: string
): Promise<{ content: string; sha: string } | null> {
  const res = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    token
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub getFileContent failed ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json?.content) {
    const content = Buffer.from(json.content, 'base64').toString('utf-8');
    return { content, sha: json.sha };
  }
  return null;
}

async function getFileSha(
  owner: string,
  repo: string,
  path: string,
  token: string
): Promise<string | null> {
  const res = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    token
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub getFileSha failed ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json?.sha ?? null;
}

async function putFile(
  owner: string,
  repo: string,
  path: string,
  contentUtf8: string,
  message: string,
  token: string,
  sha?: string | null
): Promise<any> {
  const body: any = {
    message,
    content: Buffer.from(contentUtf8, 'utf-8').toString('base64'),
  };
  if (sha) body.sha = sha;
  const res = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub putFile failed ${res.status}: ${text}`);
  }
  return res.json();
}

type ChangeType =
  | 'step_created'
  | 'step_updated'
  | 'step_deleted'
  | 'flow_updated'
  | string;

interface ChangelogEntry {
  id: string;
  change_type: ChangeType;
  description: string;
  old_value?: string;
  new_value?: string;
  field_changed?: string;
  flow_id: string;
  step_id?: string;
  created_at: string;
}

function getChangeTypeIcon(changeType: string): string {
  const icons: Record<string, string> = {
    step_created: '✅',
    step_updated: '📝',
    step_deleted: '🗑️',
    flow_updated: '🔄',
  };
  return icons[changeType] ?? '📋';
}

function formatChangelogContent(changes: ChangelogEntry[]): string {
  const groupedByFlow = changes.reduce((acc, change) => {
    if (!acc[change.flow_id]) acc[change.flow_id] = [];
    acc[change.flow_id].push(change);
    return acc;
  }, {} as Record<string, ChangelogEntry[]>);

  let content = '# FlowDocs Changelog\n\n';
  content += `Generated on: ${new Date().toISOString()}\n\n`;

  for (const [flowId, flowChanges] of Object.entries(groupedByFlow)) {
    content += `## Flow: ${flowId}\n\n`;
    for (const change of flowChanges) {
      content += `### ${getChangeTypeIcon(change.change_type)} ${change.description}\n`;
      content += `- **Timestamp:** ${new Date(change.created_at).toLocaleString()}\n`;
      if (change.field_changed) content += `- **Field:** ${change.field_changed}\n`;
      if (change.old_value) content += `- **Previous Value:** \`${change.old_value}\`\n`;
      if (change.new_value) content += `- **New Value:** \`${change.new_value}\`\n`;
      if (change.step_id) content += `- **Step ID:** ${change.step_id}\n`;
      content += '\n';
    }
  }
  return content;
}

async function commitIndividualChange(
  cfg: GitHubEnvConfig,
  change: ChangelogEntry
): Promise<void> {
  const dateFolder = new Date(change.created_at || Date.now()).toISOString().split('T')[0];
  const fileName = `changelog/${dateFolder}/${change.flow_id}/${change.id}.md`;

  const existing = await getFileSha(cfg.owner, cfg.repo, fileName, cfg.token);
  const content = formatChangelogContent([change]);
  const message = `${getChangeTypeIcon(change.change_type)} ${change.description}`;

  await putFile(cfg.owner, cfg.repo, fileName, content, message, cfg.token, existing);
}

async function updateMasterChangelog(
  cfg: GitHubEnvConfig,
  changes: ChangelogEntry[]
): Promise<void> {
  const fileName = 'CHANGELOG.md';
  const existing = await getFileContent(cfg.owner, cfg.repo, fileName, cfg.token);

  let base = existing
    ? existing.content
    : '# FlowDocs Changelog\n\nThis file contains the complete history of changes to FlowDocs.\n\n';

  const newChangesContent = formatChangelogContent(changes);
  // Insert new changes after title section (keep first two paragraphs if present)
  const sections = base.split('\n\n');
  sections.splice(2, 0, newChangesContent);
  const finalContent = sections.join('\n\n');

  await putFile(
    cfg.owner,
    cfg.repo,
    fileName,
    finalContent,
    `📋 Update changelog with ${changes.length} new change(s)`,
    cfg.token,
    existing?.sha
  );
}

export async function POST(req: Request) {
  const cfg = getEnvConfig();

  if (!cfg.enabled) {
    return NextResponse.json(
      { ok: false, message: 'GitHub sync disabled via env (GITHUB_SYNC_ENABLED=false)' },
      { status: 200 }
    );
  }
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Missing GitHub configuration. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.',
      },
      { status: 200 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const change: ChangelogEntry | undefined = body?.change;
  if (!change || !change.id || !change.flow_id || !change.description || !change.change_type) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Invalid change payload. Required: id, flow_id, description, change_type, created_at.',
      },
      { status: 400 }
    );
  }

  try {
    await commitIndividualChange(cfg, change);
    await updateMasterChangelog(cfg, [change]);
    return NextResponse.json({ ok: true, changeId: change.id }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Error syncing change to GitHub',
        error: error?.message ?? String(error),
      },
      { status: 200 }
    );
  }
}