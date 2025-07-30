# 🔧 Solución de Problemas - Integración GitHub

## Problemas Identificados

### 1. ❌ Configuración no persistente
**Problema**: La configuración de GitHub se pierde al recargar la página.

**Solución implementada**:
- ✅ Sistema de persistencia en `localStorage`
- ✅ Función `updateGitHubConfig()` para guardar configuración
- ✅ Carga automática desde `localStorage` al inicializar
- ✅ Fallback a variables de entorno si no hay configuración guardada

### 2. ❌ Sincronización no funciona
**Problema**: Los cambios en flujos y steps no se sincronizan con GitHub.

**Causas posibles**:
1. Configuración de GitHub no está activa
2. Token de GitHub inválido o sin permisos
3. Repositorio no existe o no es accesible
4. Variables de entorno no están configuradas correctamente

## 🛠️ Pasos para Solucionar

### Paso 1: Verificar Configuración
1. Ve a la página principal (`http://localhost:3000`)
2. Usa el componente "GitHub Integration Debug" para verificar:
   - ✅ Integration Status: debe mostrar "Active"
   - ✅ Saved Configuration: debe mostrar tu configuración
   - ✅ Environment Variables: verificar que estén configuradas

### Paso 2: Configurar GitHub
1. Abre el modal de configuración de GitHub (botón GitHub en cualquier flujo)
2. Completa los campos:
   - **Token**: Tu Personal Access Token de GitHub
   - **Owner**: Tu usuario o organización de GitHub
   - **Repository**: Nombre del repositorio para datos
   - **Enabled**: Activar la sincronización
3. Haz clic en "Probar Conexión" para verificar
4. Guarda la configuración

### Paso 3: Verificar Permisos del Token
Tu token de GitHub debe tener estos permisos:
- ✅ `repo` (acceso completo a repositorios)
- ✅ `contents:write` (escribir archivos)
- ✅ `metadata:read` (leer metadatos del repositorio)

### Paso 4: Probar Sincronización
1. Ve a cualquier flujo
2. Modifica el nombre del flujo
3. Agrega un nuevo step
4. Modifica un step existente
5. Verifica en la consola del navegador los logs:
   ```
   GitHub Integration status: { hasIntegration: true, ... }
   Syncing change to GitHub: { ... }
   ```

### Paso 5: Verificar en GitHub
1. Ve a tu repositorio de datos en GitHub
2. Deberías ver:
   - Archivo `CHANGELOG.md` actualizado
   - Carpeta `changelog/` con archivos organizados por fecha
   - Commits automáticos con los cambios

## 🐛 Debug y Logs

### Logs en Consola del Navegador
```javascript
// Verificar estado de integración
GitHub Integration status: {
  hasIntegration: boolean,
  changeType: string,
  description: string
}

// Verificar sincronización
Syncing change to GitHub: {
  id: string,
  change_type: string,
  description: string,
  // ...
}
```

### Verificar Configuración Manualmente
```javascript
// En la consola del navegador
localStorage.getItem('github_config')

// Debería devolver algo como:
{
  "token": "ghp_...",
  "owner": "tu-usuario",
  "repo": "tu-repo",
  "enabled": true
}
```

## 🔄 Reiniciar Integración

Si la integración no funciona:

1. **Limpiar configuración**:
   ```javascript
   localStorage.removeItem('github_config')
   ```

2. **Recargar página**

3. **Reconfigurar desde cero**

## ⚠️ Problemas Comunes

### Token Inválido
- **Síntoma**: Error 401 en las peticiones
- **Solución**: Generar nuevo token en GitHub Settings > Developer settings > Personal access tokens

### Repositorio No Encontrado
- **Síntoma**: Error 404 en las peticiones
- **Solución**: Verificar que el repositorio existe y es accesible

### Sin Permisos de Escritura
- **Síntoma**: Error 403 en las peticiones
- **Solución**: Verificar permisos del token y del repositorio

### Variables de Entorno
- **Síntoma**: Configuración no se carga automáticamente
- **Solución**: Verificar `.env.local` y reiniciar servidor de desarrollo

## 📝 Notas Importantes

1. **Prioridad de Configuración**:
   - 1º: Configuración guardada en `localStorage`
   - 2º: Variables de entorno en `.env.local`

2. **Estrategia de Sincronización**:
   - Cambios críticos (eliminaciones, actualizaciones de flujo): inmediatos
   - Otros cambios: agrupados cada 5 segundos

3. **Archivos Generados**:
   - `CHANGELOG.md`: Historial maestro
   - `changelog/YYYY-MM-DD/`: Cambios por fecha
   - Commits automáticos con formato estándar

## 🧪 Componente de Debug

El componente `GitHubDebug` está temporalmente en la página principal para facilitar el debugging. Incluye:
- Estado de la integración
- Configuración guardada
- Variables de entorno
- Botón para probar sincronización

**Nota**: Remover este componente una vez solucionados los problemas.