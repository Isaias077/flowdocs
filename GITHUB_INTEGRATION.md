# Integración con GitHub - FlowDocs

Esta guía explica cómo configurar y usar la integración con GitHub para sincronizar automáticamente el historial de cambios de FlowDocs.

## 🚀 Características

- **Sincronización Automática**: Los cambios se sincronizan automáticamente con GitHub
- **Estrategia Híbrida**: 
  - Cambios críticos (eliminaciones, actualizaciones de flujo) se sincronizan inmediatamente
  - Otros cambios se agrupan cada 5 segundos para optimizar el rendimiento
- **Historial Completo**: Se mantiene un archivo `CHANGELOG.md` maestro en el repositorio
- **Organización por Fechas**: Los cambios se organizan en carpetas por fecha
- **Interfaz de Configuración**: Panel de configuración integrado en la UI

## ⚙️ Configuración

### 1. Crear un Personal Access Token (PAT) en GitHub

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clic en "Generate new token (classic)"
3. Selecciona los siguientes permisos:
   - `repo` (acceso completo a repositorios privados)
   - `contents:write` (para crear/modificar archivos)
4. Copia el token generado

### 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# GitHub Integration Configuration
GITHUB_TOKEN=tu_personal_access_token_aqui
GITHUB_OWNER=tu_usuario_o_organizacion
GITHUB_REPO=nombre_del_repositorio
GITHUB_SYNC_ENABLED=true
```

### 3. Crear el Repositorio de Datos

1. Crea un nuevo repositorio en GitHub (puede ser privado)
2. El repositorio puede estar vacío inicialmente
3. Asegúrate de que el token tenga permisos de escritura en este repositorio

## 🗄️ Configuración de Base de Datos Appwrite

### Colecciones Requeridas

Debes crear las siguientes colecciones en tu base de datos de Appwrite:

#### 1. **projects** (Proyectos)
- **Collection ID**: `68866b70001252bec5ac`
- **Atributos**:
  - `name` (string, required) - Nombre del proyecto
  - `description` (string, required) - Descripción del proyecto
  - `documentation_links` (string, optional) - Enlaces de documentación

#### 2. **flows** (Flujos)
- **Collection ID**: `68866bc50026c708b251`
- **Atributos**:
  - `name` (string, required) - Nombre del flujo
  - `description` (string, required) - Descripción del flujo
  - `project_id` (string, required) - ID del proyecto padre
  - `section_id` (string, optional) - ID de la sección (puede ser null)
  - `status` (enum, required) - Estado del flujo
    - Valores: `draft`, `in-progress`, `review`, `approved`, `completed`, `archived`

#### 3. **sections** (Secciones)
- **Collection ID**: `68866c4c000b18d9e454`
- **Atributos**:
  - `name` (string, required) - Nombre de la sección
  - `description` (string, required) - Descripción de la sección
  - `project_id` (string, required) - ID del proyecto padre
  - `parent_section_id` (string, optional) - ID de la sección padre (puede ser null)
  - `order` (integer, required) - Orden de la sección

#### 4. **steps** (Pasos)
- **Collection ID**: `68866da8002a5a5eeb2a`
- **Atributos**:
  - `name` (string, required) - Nombre del paso
  - `description` (string, required) - Descripción del paso
  - `flow_id` (string, required) - ID del flujo padre
  - `microservice` (string, required) - Microservicio asociado
  - `order` (integer, required) - Orden del paso
  - `functional_description` (string, required) - Descripción funcional
  - `links` (string, optional) - Enlaces relacionados
  - `bdd_cases` (string, optional) - Casos BDD

#### 5. **flow_changelog** (Historial de Cambios)
- **Collection ID**: `68870aa100009524946c`
- **Atributos**:
  - `flow_id` (string, required) - ID del flujo
  - `step_id` (string, optional) - ID del paso (puede ser null)
  - `change_type` (enum, required) - Tipo de cambio
    - Valores: `step_created`, `step_updated`, `step_deleted`, `flow_updated`
  - `field_name` (string, optional) - Nombre del campo modificado
  - `old_value` (string, optional) - Valor anterior
  - `new_value` (string, optional) - Valor nuevo
  - `description` (string, required) - Descripción del cambio
  - `user_id` (string, optional) - ID del usuario que realizó el cambio

### Permisos de Colecciones

Para cada colección, configura los siguientes permisos:

- **Create**: `users` (usuarios autenticados)
- **Read**: `users` (usuarios autenticados)
- **Update**: `users` (usuarios autenticados)
- **Delete**: `users` (usuarios autenticados)

### Índices Recomendados

Para optimizar el rendimiento, crea los siguientes índices:

- **flows**: `project_id`, `section_id`, `status`
- **sections**: `project_id`, `parent_section_id`, `order`
- **steps**: `flow_id`, `order`
- **flow_changelog**: `flow_id`, `step_id`, `change_type`, `$createdAt`

## 🎯 Uso

### Configuración desde la UI

1. En cualquier página de flujo, busca el botón "GitHub" en la barra de herramientas
2. Haz clic para abrir el panel de configuración
3. Completa los campos:
   - **Propietario**: Tu usuario o nombre de organización en GitHub
   - **Repositorio**: Nombre del repositorio donde se guardarán los cambios
   - **Token**: Tu Personal Access Token
   - **Habilitar sincronización**: Activa/desactiva la sincronización
4. Haz clic en "Probar Conexión" para verificar la configuración
5. Guarda la configuración

### Sincronización Manual

Puedes forzar la sincronización de cambios pendientes:

1. Abre el panel de configuración de GitHub
2. Haz clic en "Sincronizar Pendientes"
3. Los cambios agrupados se enviarán inmediatamente a GitHub

## 📁 Estructura del Repositorio

La integración crea la siguiente estructura en tu repositorio de GitHub:

```
repositorio-datos/
├── CHANGELOG.md                    # Historial completo maestro
└── changelog/                      # Cambios organizados por fecha
    ├── 2024-01-15/                # Cambios del 15 de enero de 2024
    │   ├── batch-update.md        # Cambios agrupados
    │   └── flow-123/              # Cambios específicos del flujo
    │       └── change-id.md       # Cambio individual
    └── 2024-01-16/
        └── ...
```

## 🔄 Estrategia de Sincronización

### Cambios Críticos (Inmediatos)
- ❌ Eliminación de pasos
- 🔄 Actualización de flujos

### Cambios Agrupados (5 segundos)
- ✅ Creación de pasos
- 📝 Actualización de pasos

### Formato de Commits

- **Cambios individuales**: `🔄 Se modificó el campo "nombre" del flujo`
- **Cambios agrupados**: `📦 Batch update: step_created, step_updated (3 changes)`
- **Actualización maestro**: `📋 Update changelog with 5 new changes`

## 🛠️ Desarrollo

### Archivos Principales

- `lib/github-integration.ts`: Clase principal de integración
- `hooks/use-changelog.ts`: Hook modificado para sincronización
- `components/github-config.tsx`: Componente de configuración UI

### API de GitHub Utilizada

- `GET /repos/{owner}/{repo}/contents/{path}`: Obtener contenido de archivos
- `PUT /repos/{owner}/{repo}/contents/{path}`: Crear/actualizar archivos
- `GET /user`: Verificar autenticación
- `GET /repos/{owner}/{repo}`: Información del repositorio

### Manejo de Errores

- Los errores de sincronización no interrumpen el flujo principal
- Se registran en la consola para debugging
- La UI muestra el estado de conexión en tiempo real

## 🔧 Solución de Problemas

### Error de Autenticación
- Verifica que el token sea válido y no haya expirado
- Asegúrate de que el token tenga los permisos correctos

### Error de Permisos
- Verifica que el token tenga acceso de escritura al repositorio
- Si el repositorio es de una organización, verifica los permisos de la organización

### Cambios No Sincronizados
- Verifica que `GITHUB_SYNC_ENABLED=true` en las variables de entorno
- Usa "Sincronizar Pendientes" para forzar la sincronización
- Revisa la consola del navegador para errores

### Repositorio No Encontrado
- Verifica que el nombre del propietario y repositorio sean correctos
- Asegúrate de que el repositorio exista y sea accesible

## 📋 Checklist de Configuración

- [ ] Personal Access Token creado con permisos correctos
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Repositorio de datos creado en GitHub
- [ ] Configuración probada desde la UI
- [ ] Estado de conexión muestra "Conectado"
- [ ] Primer cambio sincronizado exitosamente

## 🔮 Próximas Mejoras

- Webhooks bidireccionales para sincronización en tiempo real
- Soporte para múltiples ramas
- Integración con GitHub Issues para tracking de cambios
- Exportación de reportes de cambios
- Notificaciones por email de cambios críticos

---

¿Necesitas ayuda? Revisa los logs de la consola o contacta al equipo de desarrollo.