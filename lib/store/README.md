# Store Global con Zustand - Fase 1

Esta es la implementación básica del store global usando Zustand para la aplicación FlowDocs.

## Estructura del Store

El store está dividido en módulos separados para mantener el código organizado y cada archivo bajo 300 líneas:

### Archivos principales:

- **`types.ts`** - Definiciones de tipos TypeScript para el store
- **`index.ts`** - Store principal que combina todos los slices
- **`project-actions.ts`** - Acciones y estado para proyectos
- **`flow-actions.ts`** - Acciones y estado para flows
- **`step-actions.ts`** - Acciones y estado para steps
- **`section-actions.ts`** - Acciones y estado para secciones
- **`changelog-actions.ts`** - Acciones y estado para changelog

## Uso básico

```typescript
import { useAppStore, useProjectActions, useProjects } from '@/lib/store'

// En un componente
function ProjectList() {
  const projects = useProjects()
  const { fetchProjects, createProject } = useProjectActions()
  
  // Usar las acciones y estado...
}
```

## Características implementadas

✅ Store modular con slices separados
✅ Integración con Appwrite
✅ Manejo de estados de carga y errores
✅ Selectores optimizados para evitar re-renders innecesarios
✅ Soporte completo para TypeScript
✅ DevTools habilitado para debugging

## Próximas fases

- **Fase 2**: Migrar componentes principales al nuevo store
- **Fase 3**: Añadir sincronización en segundo plano
- **Fase 4**: Implementar prefetching y optimizaciones avanzadas