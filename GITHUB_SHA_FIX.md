# 🔧 Corrección del Error GitHub API 422 - SHA Missing

## 🚨 Problema Identificado

Se presentaba el siguiente error al crear nuevos flows y steps:

```
Error: GitHub API Error: 422 - {
  "message": "Invalid request.\n\n\"sha\" wasn't supplied.",
  "documentation_url": "https://docs.github.com/rest/repos/contents#create-or-update-file-contents",
  "status": "422"
}
```

## 🔍 Causa Raíz

El error ocurría porque los métodos de sincronización con GitHub intentaban actualizar archivos existentes sin proporcionar el parámetro `sha` requerido por la API de GitHub.

### Métodos Afectados:
- `commitBatchedChanges()`: No verificaba si el archivo batch ya existía
- `commitIndividualChange()`: No verificaba si el archivo de cambio individual ya existía
- `syncProject()`: No verificaba si los archivos del proyecto ya existían
- `syncAllProjects()`: No verificaba si el archivo de índice ya existía

## ✅ Solución Implementada

### 1. Corrección en `commitBatchedChanges()`

**Antes:**
```typescript
private async commitBatchedChanges(changes: ChangelogEntry[]): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `changelog/${timestamp}/batch-update.md`;
  
  const content = this.formatChangelogContent(changes);
  const changeTypes = Array.from(new Set(changes.map(c => c.change_type)));
  const message = `📦 Batch update: ${changeTypes.join(', ')} (${changes.length} changes)`;

  await this.createOrUpdateFile(fileName, content, message); // ❌ Sin SHA
}
```

**Después:**
```typescript
private async commitBatchedChanges(changes: ChangelogEntry[]): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `changelog/${timestamp}/batch-update.md`;
  
  // ✅ Verificar si el archivo ya existe para obtener su SHA
  const existingFile = await this.getFileContent(fileName);
  
  const content = this.formatChangelogContent(changes);
  const changeTypes = Array.from(new Set(changes.map(c => c.change_type)));
  const message = `📦 Batch update: ${changeTypes.join(', ')} (${changes.length} changes)`;

  await this.createOrUpdateFile(fileName, content, message, existingFile?.sha); // ✅ Con SHA
}
```

### 2. Corrección en `commitIndividualChange()`

**Antes:**
```typescript
private async commitIndividualChange(change: ChangelogEntry): Promise<void> {
  const timestamp = new Date(change.created_at).toISOString().split('T')[0];
  const fileName = `changelog/${timestamp}/${change.flow_id}/${change.id}.md`;
  
  const content = this.formatChangelogContent([change]);
  const message = `${this.getChangeTypeIcon(change.change_type)} ${change.description}`;

  await this.createOrUpdateFile(fileName, content, message); // ❌ Sin SHA
}
```

**Después:**
```typescript
private async commitIndividualChange(change: ChangelogEntry): Promise<void> {
  const timestamp = new Date(change.created_at).toISOString().split('T')[0];
  const fileName = `changelog/${timestamp}/${change.flow_id}/${change.id}.md`;
  
  // ✅ Verificar si el archivo ya existe para obtener su SHA
  const existingFile = await this.getFileContent(fileName);
  
  const content = this.formatChangelogContent([change]);
  const message = `${this.getChangeTypeIcon(change.change_type)} ${change.description}`;

  await this.createOrUpdateFile(fileName, content, message, existingFile?.sha); // ✅ Con SHA
}
```

### 3. Corrección en `syncProject()`

**Antes:**
```typescript
// Guardar datos del proyecto en JSON
const projectContent = JSON.stringify(projectData, null, 2);
await this.createOrUpdateFile(
  projectFileName, 
  projectContent, 
  `📦 Sync project: ${projectData.project.name}` // ❌ Sin SHA
);

// Crear README legible para humanos
const readmeContent = this.generateProjectReadme(projectData);
await this.createOrUpdateFile(
  readmeFileName,
  readmeContent,
  `📝 Update README for project: ${projectData.project.name}` // ❌ Sin SHA
);
```

**Después:**
```typescript
// ✅ Verificar archivos existentes para obtener sus SHAs
const existingProjectFile = await this.getFileContent(projectFileName);
const existingReadmeFile = await this.getFileContent(readmeFileName);

// Guardar datos del proyecto en JSON
const projectContent = JSON.stringify(projectData, null, 2);
await this.createOrUpdateFile(
  projectFileName, 
  projectContent, 
  `📦 Sync project: ${projectData.project.name}`,
  existingProjectFile?.sha // ✅ Con SHA
);

// Crear README legible para humanos
const readmeContent = this.generateProjectReadme(projectData);
await this.createOrUpdateFile(
  readmeFileName,
  readmeContent,
  `📝 Update README for project: ${projectData.project.name}`,
  existingReadmeFile?.sha // ✅ Con SHA
);
```

### 4. Corrección en `syncAllProjects()`

**Antes:**
```typescript
// Crear índice de todos los proyectos
const indexContent = this.generateProjectsIndex(projects);
await this.createOrUpdateFile(
  'projects/README.md',
  indexContent,
  `📋 Update projects index (${projects.length} projects)` // ❌ Sin SHA
);
```

**Después:**
```typescript
// ✅ Verificar si el archivo de índice ya existe
const existingIndexFile = await this.getFileContent('projects/README.md');

// Crear índice de todos los proyectos
const indexContent = this.generateProjectsIndex(projects);
await this.createOrUpdateFile(
  'projects/README.md',
  indexContent,
  `📋 Update projects index (${projects.length} projects)`,
  existingIndexFile?.sha // ✅ Con SHA
);
```

## 🔧 Método `getFileContent()` Utilizado

Todos los métodos corregidos ahora utilizan el método existente `getFileContent()` que:

1. **Verifica si el archivo existe** en el repositorio de GitHub
2. **Obtiene el contenido** del archivo si existe
3. **Retorna el SHA** necesario para actualizaciones
4. **Retorna null** si el archivo no existe (creación nueva)

```typescript
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
```

## 🎯 Resultado

### ✅ Problemas Resueltos:
- **Error 422 eliminado**: Ya no se produce el error de SHA faltante
- **Sincronización funcional**: Los flows y steps se sincronizan correctamente
- **Actualizaciones correctas**: Los archivos existentes se actualizan sin problemas
- **Creaciones nuevas**: Los archivos nuevos se crean sin conflictos

### 🔄 Flujo Corregido:
1. **Verificación**: Se verifica si el archivo ya existe en GitHub
2. **Obtención de SHA**: Si existe, se obtiene su SHA actual
3. **Operación**: Se crea o actualiza el archivo con el SHA correcto
4. **Resultado**: Operación exitosa sin errores 422

## 🧪 Verificación

Para verificar que la corrección funciona:

1. **Crear un nuevo flow** en cualquier proyecto
2. **Agregar steps** al flow
3. **Verificar en GitHub** que los archivos se crean/actualizan correctamente
4. **No debe aparecer** el error 422 en la consola del navegador

---

*Corrección implementada el ${new Date().toLocaleDateString()} - Error GitHub API 422 resuelto*