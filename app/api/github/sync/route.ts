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

// Types mirrored for payloads
interface ProjectExportData {
  project: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
  flows: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    created_at: string;
    updated_at: string;
    steps: Array<{
      id: string;
      name: string;
      description?: string;
      microservice: string;
      order: number;
      created_at: string;
      updated_at: string;
    }>;
  }>;
}

async function getFileSha(owner: string, repo: string, path: string, token: string): Promise<string | null> {
  const res = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, token);
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
  const res = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub putFile failed ${res.status}: ${text}`);
  }
  return res.json();
}

function generateProjectReadme(projectData: ProjectExportData): string {
  let content = `# ${projectData.project.name}\n\n`;
  if (projectData.project.description) {
    content += `${projectData.project.description}\n\n`;
  }
  content += `**Creado:** ${new Date(projectData.project.created_at).toLocaleDateString()}\n`;
  content += `**Última actualización:** ${new Date(projectData.project.updated_at).toLocaleDateString()}\n\n`;
  content += `## 🔄 Flows (${projectData.flows.length})\n\n`;
  projectData.flows.forEach((flow, index) => {
    content += `### ${index + 1}. ${flow.name}\n\n`;
    if (flow.description) {
      content += `**Descripción:** ${flow.description}\n\n`;
    }
    content += `**Estado:** ${flow.status}\n`;
    content += `**Steps:** ${flow.steps.length}\n\n`;
    if (flow.steps.length > 0) {
      content += `#### Steps:\n\n`;
      flow.steps
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((step, stepIndex) => {
          content += `${stepIndex + 1}. **${step.name}** (${step.microservice})\n`;
          if (step.description) {
            content += `   - ${step.description}\n`;
          }
        });
      content += `\n`;
    }
  });
  content += `\n---\n\n`;
  content += `*Generado automáticamente por FlowDocs el ${new Date().toLocaleString()}*\n`;
  return content;
}

function generateProjectsIndex(projects: ProjectExportData[]): string {
  let content = `# FlowDocs - Índice de Proyectos\n\n`;
  content += `Total de proyectos: **${projects.length}**\n\n`;
  projects.forEach((projectData, index) => {
    const totalSteps = projectData.flows.reduce((sum, flow) => sum + flow.steps.length, 0);
    content += `## ${index + 1}. [${projectData.project.name}](${projectData.project.id}/README.md)\n\n`;
    if (projectData.project.description) {
      content += `${projectData.project.description}\n\n`;
    }
    content += `- **Flows:** ${projectData.flows.length}\n`;
    content += `- **Steps totales:** ${totalSteps}\n`;
    content += `- **Última actualización:** ${new Date(projectData.project.updated_at).toLocaleDateString()}\n\n`;
  });
  content += `\n---\n\n`;
  content += `*Generado automáticamente por FlowDocs el ${new Date().toLocaleString()}*\n`;
  return content;
}

async function upsertProjectToGitHub(
  cfg: GitHubEnvConfig,
  projectData: ProjectExportData
): Promise<void> {
  const projectFileName = `projects/${projectData.project.id}/project.json`;
  const readmeFileName = `projects/${projectData.project.id}/README.md`;

  const projectSha = await getFileSha(cfg.owner, cfg.repo, projectFileName, cfg.token);
  const readmeSha = await getFileSha(cfg.owner, cfg.repo, readmeFileName, cfg.token);

  const projectContent = JSON.stringify(projectData, null, 2);
  await putFile(
    cfg.owner,
    cfg.repo,
    projectFileName,
    projectContent,
    `📦 Sync project: ${projectData.project.name}`,
    cfg.token,
    projectSha
  );

  const readmeContent = generateProjectReadme(projectData);
  await putFile(
    cfg.owner,
    cfg.repo,
    readmeFileName,
    readmeContent,
    `📝 Update README for project: ${projectData.project.name}`,
    cfg.token,
    readmeSha
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

  try {
    if (body?.project) {
      const project: ProjectExportData = body.project;
      await upsertProjectToGitHub(cfg, project);
      return NextResponse.json(
        { ok: true, mode: 'single', projectId: project.project.id },
        { status: 200 }
      );
    }

    if (Array.isArray(body?.projects)) {
      const projects: ProjectExportData[] = body.projects;

      // Update global index first
      const indexSha = await getFileSha(cfg.owner, cfg.repo, 'projects/README.md', cfg.token);
      const indexContent = generateProjectsIndex(projects);
      await putFile(
        cfg.owner,
        cfg.repo,
        'projects/README.md',
        indexContent,
        `📋 Update projects index (${projects.length} projects)`,
        cfg.token,
        indexSha
      );

      for (const p of projects) {
        await upsertProjectToGitHub(cfg, p);
      }
      return NextResponse.json(
        { ok: true, mode: 'batch', count: projects.length },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: false, message: 'Provide { project } or { projects: [] } in body' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Error syncing to GitHub',
        error: error?.message ?? String(error),
      },
      { status: 200 }
    );
  }
}