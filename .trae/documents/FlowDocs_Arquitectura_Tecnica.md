# FlowDocs - Documento de Arquitectura Técnica

## 1. Diseño de Arquitectura

```mermaid
graph TD
    A[Navegador del Usuario] --> B[Aplicación React Frontend]
    B --> C[Zustand Store]
    B --> D[AppWrite SDK]
    D --> E[Servicio AppWrite]
    
    subgraph "Capa Frontend"
        B
        C
    end
    
    subgraph "Capa de Servicios (Proporcionada por AppWrite)"
        E
        F[Base de Datos NoSQL]
        G[Autenticación]
        H[Almacenamiento de Archivos]
    end
    
    E --> F
    E --> G
    E --> H
```

## 2. Descripción de Tecnologías

* **Frontend**: React\@18 + Next.js\@13.5.1 + TypeScript + Tailwind CSS + Zustand

* **Backend**: AppWrite (Backend-as-a-Service)

* **Base de Datos**: AppWrite Database (NoSQL)

* **UI Components**: Radix UI + shadcn/ui

* **Diagramas**: React Flow

* **Drag & Drop**: @dnd-kit

* **Exportación**: jsPDF + html2canvas

## 3. Definiciones de Rutas

| Ruta                            | Propósito                                                       |
| ------------------------------- | --------------------------------------------------------------- |
| /                               | Página de inicio con hero section y características principales |
| /projects                       | Dashboard de proyectos, lista y gestión de proyectos            |
| /projects/\[id]                 | Vista detallada de proyecto con secciones y flujos              |
| /projects/\[id]/flows/\[flowId] | Editor visual de flujos con diagramas interactivos              |

## 4. Definiciones de API (AppWrite Collections)

### 4.1 APIs Principales

**Gestión de Proyectos**

```
GET /databases/{databaseId}/collections/68866b70001252bec5ac/documents
```

Request:

| Parámetro | Tipo   | Requerido | Descripción                        |
| --------- | ------ | --------- | ---------------------------------- |
| queries   | array  | false     | Filtros de consulta AppWrite       |
| limit     | number | false     | Límite de resultados (default: 25) |

Response:

| Campo     | Tipo   | Descripción         |
| --------- | ------ | ------------------- |
| documents | array  | Lista de proyectos  |
| total     | number | Total de documentos |

Ejemplo:

```json
{
  "documents": [
    {
      "$id": "project_123",
      "name": "Sistema de Pagos",
      "description": "Microservicios para procesamiento de pagos",
      "documentation_links": "{\"api\": [{\"url\": \"https://api.docs\", \"title\": \"API Reference\"}]}"
    }
  ],
  "total": 1
}
```

**Gestión de Flujos**

```
POST /databases/{databaseId}/collections/68866bc50026c708b251/documents
```

Request:

| Parámetro   | Tipo   | Requerido | Descripción                                                       |
| ----------- | ------ | --------- | ----------------------------------------------------------------- |
| name        | string | true      | Nombre del flujo                                                  |
| description | string | true      | Descripción del flujo                                             |
| project\_id | string | true      | ID del proyecto padre                                             |
| section\_id | string | false     | ID de la sección (opcional)                                       |
| status      | string | true      | Estado: draft, in-progress, review, approved, completed, archived |

Response:

| Campo      | Tipo   | Descripción               |
| ---------- | ------ | ------------------------- |
| $id        | string | ID único del flujo creado |
| $createdAt | string | Fecha de creación         |

**Gestión de Pasos**

```
PUT /databases/{databaseId}/collections/68866da8002a5a5eeb2a/documents/{stepId}
```

Request:

| Parámetro               | Tipo   | Requerido | Descripción                     |
| ----------------------- | ------ | --------- | ------------------------------- |
| name                    | string | true      | Nombre del paso                 |
| microservice            | string | true      | Microservicio responsable       |
| functional\_description | string | true      | Descripción funcional detallada |
| bdd\_cases              | string | false     | Casos BDD en formato texto      |
| links                   | string | false     | JSON con enlaces relacionados   |
| order                   | number | true      | Orden de ejecución              |

## 5. Arquitectura del Cliente

```mermaid
graph TD
    A[Componentes React] --> B[Zustand Store]
    B --> C[Slices Especializados]
    C --> D[AppWrite SDK]
    D --> E[AppWrite Cloud]
    
    subgraph "Store Management"
        F[Project Slice]
        G[Flow Slice]
        H[Step Slice]
        I[Section Slice]
        J[Changelog Slice]
    end
    
    C --> F
    C --> G
    C --> H
    C --> I
    C --> J
```

## 6. Modelo de Datos

### 6.1 Definición del Modelo de Datos

```mermaid
erDiagram
    PROJECT ||--o{ SECTION : contains
    PROJECT ||--o{ FLOW : contains
    PROJECT ||--o{ FLOW_CHANGELOG : tracks
    SECTION ||--o{ SECTION : "parent-child"
    SECTION ||--o{ FLOW : organizes
    FLOW ||--o{ STEP : contains
    FLOW ||--o{ FLOW_CHANGELOG : tracks
    STEP ||--o{ FLOW_CHANGELOG : tracks
    
    PROJECT {
        string id PK
        string name
        string description
        string documentation_links
        datetime createdAt
        datetime updatedAt
    }
    
    SECTION {
        string id PK
        string name
        string description
        string project_id FK
        string parent_section_id FK
        number order
        datetime createdAt
        datetime updatedAt
    }
    
    FLOW {
        string id PK
        string name
        string description
        string project_id FK
        string section_id FK
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    STEP {
        string id PK
        string name
        string description
        string flow_id FK
        string microservice
        number order
        string functional_description
        string links
        string bdd_cases
        datetime createdAt
        datetime updatedAt
    }
    
    FLOW_CHANGELOG {
        string id PK
        string flow_id FK
        string step_id FK
        string change_type
        string field_name
        string old_value
        string new_value
        string description
        string user_id
        datetime createdAt
        datetime updatedAt
    }
```

### 6.2 Lenguaje de Definición de Datos (DDL)

**Colección Projects (ID: 68866b70001252bec5ac)**

```javascript
// Estructura de atributos en AppWrite
{
  "name": {
    "type": "string",
    "size": 255,
    "required": true
  },
  "description": {
    "type": "string",
    "size": 1000,
    "required": true
  },
  "documentation_links": {
    "type": "string",
    "size": 5000,
    "required": false,
    "default": "{}"
  }
}

// Índices recomendados
// - name (ascending)
// - $createdAt (descending)
```

**Colección Flows (ID: 68866bc50026c708b251)**

```javascript
{
  "name": {
    "type": "string",
    "size": 255,
    "required": true
  },
  "description": {
    "type": "string",
    "size": 1000,
    "required": true
  },
  "project_id": {
    "type": "string",
    "size": 36,
    "required": true
  },
  "section_id": {
    "type": "string",
    "size": 36,
    "required": false
  },
  "status": {
    "type": "string",
    "size": 20,
    "required": true,
    "default": "draft"
  }
}

// Índices recomendados
// - project_id (ascending)
// - section_id (ascending)
// - status (ascending)
// - $createdAt (descending)
```

**Colección Steps (ID: 68866da8002a5a5eeb2a)**

```javascript
{
  "name": {
    "type": "string",
    "size": 255,
    "required": true
  },
  "description": {
    "type": "string",
    "size": 500,
    "required": true
  },
  "flow_id": {
    "type": "string",
    "size": 36,
    "required": true
  },
  "microservice": {
    "type": "string",
    "size": 100,
    "required": true
  },
  "order": {
    "type": "integer",
    "required": true,
    "default": 0
  },
  "functional_description": {
    "type": "string",
    "size": 2000,
    "required": false
  },
  "links": {
    "type": "string",
    "size": 3000,
    "required": false,
    "default": "[]"
  },
  "bdd_cases": {
    "type": "string",
    "size": 5000,
    "required": false
  }
}

// Índices recomendados
// - flow_id (ascending)
// - order (ascending)
// - microservice (ascending)
```

**Colección Sections (ID: 68866c4c000b18d9e454)**

```javascript
{
  "name": {
    "type": "string",
    "size": 255,
    "required": true
  },
  "description": {
    "type": "string",
    "size": 1000,
    "required": false
  },
  "project_id": {
    "type": "string",
    "size": 36,
    "required": true
  },
  "parent_section_id": {
    "type": "string",
    "size": 36,
    "required": false
  },
  "order": {
    "type": "integer",
    "required": true,
    "default": 0
  }
}

// Índices recomendados
// - project_id (ascending)
// - parent_section_id (ascending)
// - order (ascending)
```

**Colección Flow Changelog (ID: 68870aa100009524946c)**

```javascript
{
  "flow_id": {
    "type": "string",
    "size": 36,
    "required": true
  },
  "step_id": {
    "type": "string",
    "size": 36,
    "required": false
  },
  "change_type": {
    "type": "string",
    "size": 50,
    "required": true
  },
  "field_name": {
    "type": "string",
    "size": 100,
    "required": false
  },
  "old_value": {
    "type": "string",
    "size": 1000,
    "required": false
  },
  "new_value": {
    "type": "string",
    "size": 1000,
    "required": false
  },
  "description": {
    "type": "string",
    "size": 500,
    "required": true
  },
  "user_id": {
    "type": "string",
    "size": 36,
    "required": false
  }
}

// Índices recomendados
// - flow_id (ascending)
// - step_id (ascending)
// - change_type (ascending)
// - $createdAt (descending)
```

