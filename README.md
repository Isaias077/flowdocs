# FlowDocs 📋

**Sistema de Gestión y Documentación de Flujos de Trabajo para Arquitecturas de Microservicios**

FlowDocs es una aplicación web moderna diseñada específicamente para equipos de desarrollo que trabajan con arquitecturas de microservicios. Permite crear, gestionar y documentar flujos de trabajo complejos de manera visual e interactiva, facilitando la comprensión y mantenimiento de sistemas distribuidos.

## 🎯 Objetivo Principal

La aplicación tiene como objetivo principal **simplificar la documentación y gestión de flujos de trabajo en arquitecturas de microservicios**, proporcionando una interfaz visual intuitiva que permite a los equipos de desarrollo:

- **Mapear flujos complejos** entre múltiples microservicios
- **Documentar procesos de negocio** de manera estructurada y visual
- **Mantener trazabilidad** de cambios y estados en los flujos
- **Centralizar la documentación** técnica y funcional
- **Facilitar la colaboración** entre equipos técnicos y de negocio

## 🏗️ Arquitectura y Tecnologías

### Frontend
- **Next.js 13.5.1** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor robustez
- **Tailwind CSS** - Framework de utilidades CSS
- **Radix UI** - Componentes accesibles y personalizables
- **React Flow** - Biblioteca para diagramas interactivos
- **Lucide React** - Iconografía moderna

### Backend y Base de Datos
- **AppWrite** - Backend-as-a-Service para autenticación y base de datos
- **Base de datos NoSQL** - Almacenamiento de documentos JSON

### Funcionalidades Avanzadas
- **Drag & Drop** - Interfaz intuitiva con @dnd-kit
- **Exportación PDF** - Generación de documentos con jsPDF
- **Componentes Resizable** - Paneles ajustables
- **Notificaciones** - Sistema de toast con Sonner

## 🚀 Funcionalidades Principales

### 1. Gestión de Proyectos
- **Creación y edición** de proyectos con metadatos completos
- **Organización jerárquica** mediante secciones anidadas
- **Enlaces de documentación** centralizados por proyecto
- **Estados de proyecto** para control de ciclo de vida

### 2. Gestión de Flujos (Flows)
- **Creación de flujos** con nombre, descripción y estado
- **Estados de flujo**: Draft, In Progress, Review, Approved, Completed, Archived
- **Organización por secciones** para mejor estructura
- **Edición en línea** de nombres y propiedades
- **Filtrado y búsqueda** avanzada de flujos

### 3. Editor Visual de Pasos (Steps)
- **Diagrama interactivo** con React Flow
- **Creación de pasos** con información detallada:
  - Nombre y descripción funcional
  - Microservicio responsable
  - Orden de ejecución
  - Casos BDD (Behavior Driven Development)
  - Enlaces relacionados (documentación, PRs, etc.)
- **Conexiones visuales** entre pasos
- **Panel lateral** para edición detallada

### 4. Sistema de Secciones Jerárquicas
- **Estructura de árbol** para organización
- **Drag & Drop** para reordenamiento
- **Secciones anidadas** sin límite de profundidad
- **Asignación de flujos** a secciones específicas

### 5. Gestión de Enlaces y Documentación
- **Enlaces tipificados**: API, Architecture, Requirements, Deployment
- **Gestión centralizada** por proyecto
- **Enlaces por paso**: Docs, PRs, BDD, Others
- **Validación de URLs** y metadatos

### 6. Exportación y Reportes
- **Exportación a PDF** de flujos completos
- **Impresión optimizada** de diagramas
- **Documentación estructurada** con metadatos

## 📊 Modelo de Datos

### Entidades Principales

#### Project
```typescript
interface Project {
  $id: string                    // ID único
  name: string                   // Nombre del proyecto
  description: string            // Descripción detallada
  documentation_links: string    // JSON con enlaces de documentación
  $createdAt: string            // Fecha de creación
  $updatedAt: string            // Última actualización
}
```

#### Flow
```typescript
interface Flow {
  $id: string                    // ID único
  name: string                   // Nombre del flujo
  description: string            // Descripción del flujo
  project_id: string            // Referencia al proyecto
  section_id: string | null     // Sección opcional
  status: 'draft' | 'in-progress' | 'review' | 'approved' | 'completed' | 'archived'
  $createdAt: string            // Fecha de creación
  $updatedAt: string            // Última actualización
}
```

#### Step
```typescript
interface Step {
  $id: string                    // ID único
  name: string                   // Nombre del paso
  description: string            // Descripción breve
  flow_id: string               // Referencia al flujo
  microservice: string          // Microservicio responsable
  order: number                 // Orden de ejecución
  functional_description: string // Descripción funcional detallada
  links: string                 // JSON con enlaces relacionados
  bdd_cases: string            // Casos BDD en formato texto
  $createdAt: string           // Fecha de creación
  $updatedAt: string           // Última actualización
}
```

#### Section
```typescript
interface Section {
  $id: string                    // ID único
  name: string                   // Nombre de la sección
  description: string            // Descripción
  project_id: string            // Referencia al proyecto
  parent_section_id: string | null // Sección padre (para jerarquía)
  order: number                 // Orden dentro del nivel
  $createdAt: string           // Fecha de creación
  $updatedAt: string           // Última actualización
}
```

## 🎨 Interfaz de Usuario

### Características de UX/UI
- **Diseño responsive** adaptable a diferentes dispositivos
- **Tema claro/oscuro** con persistencia de preferencias
- **Navegación intuitiva** con breadcrumbs y enlaces contextuales
- **Modales modernos** con scroll horizontal para formularios extensos
- **Barras de scroll personalizadas** con gradientes y efectos hover
- **Notificaciones toast** para feedback inmediato
- **Iconografía consistente** con Lucide React

### Componentes Principales
- **FlowDiagram**: Editor visual de flujos con React Flow
- **StepPanel**: Panel lateral para edición detallada de pasos
- **SortableSectionTree**: Árbol jerárquico con drag & drop
- **EditableTitle**: Edición en línea de títulos
- **DocumentationModal**: Gestión de enlaces de documentación
- **FlowCard**: Tarjetas de flujo con acciones contextuales

## 🔧 Configuración y Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta en AppWrite Cloud o instancia local

### Variables de Entorno
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=tu_database_id
```

### Instalación
```bash
# Clonar el repositorio
git clone [repository-url]
cd flowdocs

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de AppWrite

# Ejecutar en modo desarrollo
npm run dev
```

### Configuración de AppWrite
1. Crear proyecto en AppWrite
2. Crear base de datos
3. Crear colecciones con los IDs especificados en `lib/appwrite.ts`:
   - `PROJECTS`: 68866b70001252bec5ac
   - `FLOWS`: 68866bc50026c708b251
   - `SECTIONS`: 68866c4c000b18d9e454
   - `STEPS`: 68866da8002a5a5eeb2a
4. Configurar permisos de lectura/escritura

## 📁 Estructura del Proyecto

```
flowdocs/
├── app/                      # App Router de Next.js
│   ├── globals.css          # Estilos globales y variables CSS
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx            # Página de inicio
│   └── projects/           # Rutas de proyectos
│       ├── page.tsx        # Lista de proyectos
│       └── [id]/           # Proyecto específico
│           ├── page.tsx    # Detalle del proyecto
│           └── flows/      # Flujos del proyecto
│               └── [flowId]/
│                   └── page.tsx # Editor de flujo
├── components/              # Componentes React
│   ├── ui/                 # Componentes base (Radix UI)
│   ├── flow-diagram.tsx    # Editor visual de flujos
│   ├── step-panel.tsx      # Panel de edición de pasos
│   ├── flow-card.tsx       # Tarjeta de flujo
│   └── ...
├── lib/                    # Utilidades y configuración
│   ├── appwrite.ts         # Cliente y configuración AppWrite
│   └── utils.ts           # Utilidades generales
├── types/                  # Definiciones TypeScript
│   └── index.ts           # Interfaces principales
└── hooks/                  # Custom hooks
    └── use-toast.ts       # Hook para notificaciones
```

## 🔄 Flujo de Trabajo Típico

1. **Crear Proyecto**: Definir un nuevo proyecto con documentación base
2. **Organizar Secciones**: Estructurar el proyecto en secciones jerárquicas
3. **Crear Flujos**: Definir flujos de trabajo por funcionalidad
4. **Diseñar Pasos**: Crear pasos detallados y si funcionas con un sistema distribuido puedes agregar información de microservicios
5. **Conectar Pasos**: Establecer relaciones visuales en el diagrama
6. **Documentar**: Añadir enlaces, casos BDD y descripciones funcionales
7. **Revisar y Aprobar**: Gestionar estados del flujo
8. **Exportar**: Generar documentación en PDF

## 🎯 Casos de Uso Principales

### Para Arquitectos de Software
- Diseñar y documentar arquitecturas de microservicios
- Mapear dependencias entre servicios
- Definir contratos de comunicación

### Para Product Owners
- Visualizar flujos de negocio de manera comprensible
- Gestionar estados y aprobaciones de procesos
- Mantener trazabilidad de requerimientos

### Para Desarrolladores
- Entender flujos complejos antes de implementar
- Documentar casos BDD y criterios de aceptación
- Mantener enlaces a PRs y documentación técnica

### Para QA Engineers
- Acceder a casos de prueba estructurados
- Entender el contexto completo de funcionalidades
- Validar flujos end-to-end

## 🚀 Características Avanzadas

### Edición Colaborativa
- Actualizaciones en tiempo real
- Control de versiones implícito
- Historial de cambios

### Integración con Herramientas
- Enlaces directos a repositorios
- Integración con documentación externa
- Exportación a múltiples formatos

### Escalabilidad
- Arquitectura modular
- Componentes reutilizables
- Optimización de rendimiento

## 📈 Beneficios Empresariales

- **Reducción de tiempo** en onboarding de nuevos desarrolladores
- **Mejora en la comunicación** entre equipos técnicos y de negocio
- **Centralización de conocimiento** evitando silos de información
- **Trazabilidad completa** de procesos y decisiones
- **Documentación viva** que evoluciona con el código

## 🔮 Roadmap Futuro

- [ ] Integración con APIs de repositorios (GitHub, GitLab)
- [ ] Versionado de flujos con diff visual
- [ ] Colaboración en tiempo real multi-usuario
- [ ] Plantillas de flujos predefinidas
- [ ] Métricas y analytics de uso
- [ ] Integración con herramientas de CI/CD
- [ ] API REST para integraciones externas

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**FlowDocs** - Transformando la complejidad de los microservicios en claridad visual. 🚀