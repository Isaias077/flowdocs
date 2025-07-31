interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  enabled: boolean;
}

export interface ProjectExportData {
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

interface ChangelogEntry {
  id: string;
  change_type: string;
  description: string;
  old_value?: string;
  new_value?: string;
  field_changed?: string;
  flow_id: string;
  step_id?: string;
  created_at: string;
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
}

export class GitHubIntegration {
  private config: GitHubConfig;
  private baseUrl = 'https://api.github.com';
  private pendingChanges: ChangelogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 5000; // 5 segundos para agrupar cambios

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private async makeGitHubRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'FlowDocs-App',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  private async getFileContent(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const response = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`
      );
      
      if (response.content) {
        const content = Buffer.from(response.content, 'base64').toString('utf-8');
        return { content, sha: response.sha };
      }
      return null;
    } catch (error) {
      // Archivo no existe
      return null;
    }
  }

  private async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<GitHubCommitResponse> {
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
    };

    if (sha) {
      body.sha = sha;
    }

    return this.makeGitHubRequest(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  private formatChangelogContent(changes: ChangelogEntry[]): string {
    const groupedByFlow = changes.reduce((acc, change) => {
      if (!acc[change.flow_id]) {
        acc[change.flow_id] = [];
      }
      acc[change.flow_id].push(change);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);

    let content = '# FlowDocs Changelog\n\n';
    content += `Generated on: ${new Date().toISOString()}\n\n`;

    for (const [flowId, flowChanges] of Object.entries(groupedByFlow)) {
      content += `## Flow: ${flowId}\n\n`;
      
      for (const change of flowChanges) {
        content += `### ${this.getChangeTypeIcon(change.change_type)} ${change.description}\n`;
        content += `- **Timestamp:** ${new Date(change.created_at).toLocaleString()}\n`;
        
        if (change.field_changed) {
          content += `- **Field:** ${change.field_changed}\n`;
        }
        
        if (change.old_value) {
          content += `- **Previous Value:** \`${change.old_value}\`\n`;
        }
        
        if (change.new_value) {
          content += `- **New Value:** \`${change.new_value}\`\n`;
        }
        
        if (change.step_id) {
          content += `- **Step ID:** ${change.step_id}\n`;
        }
        
        content += '\n';
      }
    }

    return content;
  }

  private getChangeTypeIcon(changeType: string): string {
    const icons = {
      'step_created': '✅',
      'step_updated': '📝',
      'step_deleted': '🗑️',
      'flow_updated': '🔄',
    };
    return icons[changeType as keyof typeof icons] || '📋';
  }

  private async commitIndividualChange(change: ChangelogEntry): Promise<void> {
    const timestamp = new Date(change.created_at).toISOString().split('T')[0];
    const fileName = `changelog/${timestamp}/${change.flow_id}/${change.id}.md`;
    
    // Verificar si el archivo ya existe para obtener su SHA
    const existingFile = await this.getFileContent(fileName);
    
    const content = this.formatChangelogContent([change]);
    const message = `${this.getChangeTypeIcon(change.change_type)} ${change.description}`;

    await this.createOrUpdateFile(fileName, content, message, existingFile?.sha);
  }

  private async commitBatchedChanges(changes: ChangelogEntry[]): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `changelog/${timestamp}/batch-update.md`;
    
    // Verificar si el archivo ya existe para obtener su SHA
    const existingFile = await this.getFileContent(fileName);
    
    const content = this.formatChangelogContent(changes);
    const changeTypes = Array.from(new Set(changes.map(c => c.change_type)));
    const message = `📦 Batch update: ${changeTypes.join(', ')} (${changes.length} changes)`;

    await this.createOrUpdateFile(fileName, content, message, existingFile?.sha);
  }

  private async updateMasterChangelog(changes: ChangelogEntry[]): Promise<void> {
    const fileName = 'CHANGELOG.md';
    const existingFile = await this.getFileContent(fileName);
    
    let content = '';
    if (existingFile) {
      content = existingFile.content;
    } else {
      content = '# FlowDocs Changelog\n\nThis file contains the complete history of changes to FlowDocs.\n\n';
    }

    // Agregar nuevos cambios al inicio
    const newChangesContent = this.formatChangelogContent(changes);
    const sections = content.split('\n\n');
    sections.splice(2, 0, newChangesContent);
    content = sections.join('\n\n');

    const message = `📋 Update changelog with ${changes.length} new changes`;
    await this.createOrUpdateFile(fileName, content, message, existingFile?.sha);
  }

  public async syncChange(change: ChangelogEntry): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Estrategia híbrida: cambios críticos van inmediatamente
      const criticalChanges = ['step_deleted', 'flow_updated'];
      
      if (criticalChanges.includes(change.change_type)) {
        // Commit inmediato para cambios críticos
        await this.commitIndividualChange(change);
        await this.updateMasterChangelog([change]);
      } else {
        // Agrupar cambios no críticos
        this.pendingChanges.push(change);
        
        // Reiniciar el timer de batch
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(async () => {
          if (this.pendingChanges.length > 0) {
            const changesToCommit = [...this.pendingChanges];
            this.pendingChanges = [];
            
            await this.commitBatchedChanges(changesToCommit);
            await this.updateMasterChangelog(changesToCommit);
          }
        }, this.BATCH_DELAY);
      }
    } catch (error) {
      console.error('Error syncing change to GitHub:', error);
      // No lanzar el error para no interrumpir el flujo principal
    }
  }

  public async forceBatchCommit(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.pendingChanges.length > 0) {
      const changesToCommit = [...this.pendingChanges];
      this.pendingChanges = [];
      
      await this.commitBatchedChanges(changesToCommit);
      await this.updateMasterChangelog(changesToCommit);
    }
  }

  // Nuevos métodos para sincronización a nivel de proyecto
  public async syncProject(projectData: ProjectExportData): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const projectFileName = `projects/${projectData.project.id}/project.json`;
      const readmeFileName = `projects/${projectData.project.id}/README.md`;
      
      // Verificar archivos existentes para obtener sus SHAs
      const existingProjectFile = await this.getFileContent(projectFileName);
      const existingReadmeFile = await this.getFileContent(readmeFileName);
      
      // Guardar datos del proyecto en JSON
      const projectContent = JSON.stringify(projectData, null, 2);
      await this.createOrUpdateFile(
        projectFileName, 
        projectContent, 
        `📦 Sync project: ${projectData.project.name}`,
        existingProjectFile?.sha
      );
      
      // Crear README legible para humanos
      const readmeContent = this.generateProjectReadme(projectData);
      await this.createOrUpdateFile(
        readmeFileName,
        readmeContent,
        `📝 Update README for project: ${projectData.project.name}`,
        existingReadmeFile?.sha
      );
      
      console.log(`Project ${projectData.project.name} synced to GitHub successfully`);
    } catch (error) {
      console.error('Error syncing project to GitHub:', error);
      throw error;
    }
  }

  private generateProjectReadme(projectData: ProjectExportData): string {
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

  public async syncAllProjects(projects: ProjectExportData[]): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Verificar si el archivo de índice ya existe
      const existingIndexFile = await this.getFileContent('projects/README.md');
      
      // Crear índice de todos los proyectos
      const indexContent = this.generateProjectsIndex(projects);
      await this.createOrUpdateFile(
        'projects/README.md',
        indexContent,
        `📋 Update projects index (${projects.length} projects)`,
        existingIndexFile?.sha
      );
      
      // Sincronizar cada proyecto individualmente
      for (const project of projects) {
        await this.syncProject(project);
      }
      
      console.log(`${projects.length} projects synced to GitHub successfully`);
    } catch (error) {
      console.error('Error syncing all projects to GitHub:', error);
      throw error;
    }
  }

  private generateProjectsIndex(projects: ProjectExportData[]): string {
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

  public async testConnection(): Promise<boolean> {
    try {
      await this.makeGitHubRequest('/user');
      return true;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  public async getRepositoryInfo(): Promise<any> {
    return this.makeGitHubRequest(`/repos/${this.config.owner}/${this.config.repo}`);
  }

  public updateConfig(newConfig: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instancia singleton
let githubIntegration: GitHubIntegration | null = null;

// Función para obtener configuración desde localStorage o variables de entorno
function getGitHubConfig(): GitHubConfig {
  // Intentar cargar desde localStorage primero (configuración del usuario)
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('github_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return parsed;
      } catch (error) {
        console.error('Error parsing saved GitHub config:', error);
      }
    }
  }

  // Fallback a variables de entorno
  return {
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
    owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || '',
    repo: process.env.NEXT_PUBLIC_GITHUB_REPO || '',
    enabled: process.env.NEXT_PUBLIC_GITHUB_SYNC_ENABLED === 'true'
  };
}

export function getGitHubIntegration(): GitHubIntegration | null {
  const config = getGitHubConfig();
  
  // Si la configuración no está habilitada o está incompleta, resetear la integración
  if (!config.enabled || !config.token || !config.owner || !config.repo) {
    if (githubIntegration) {
      githubIntegration = null;
    }
    return null;
  }
  
  // Si no hay integración pero la configuración es válida, crear una nueva
  if (!githubIntegration) {
    githubIntegration = new GitHubIntegration(config);
  }

  return githubIntegration;
}

// Función para actualizar la configuración y reinicializar la integración
export function updateGitHubConfig(newConfig: GitHubConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('github_config', JSON.stringify(newConfig));
  }
  
  // Reinicializar la integración con la nueva configuración
  resetGitHubIntegration();
  
  if (newConfig.enabled && newConfig.token && newConfig.owner && newConfig.repo) {
    githubIntegration = new GitHubIntegration(newConfig);
  }
}

export function resetGitHubIntegration(): void {
  githubIntegration = null;
}