# Scripts de Migración

## migrate-microservice-to-executor.js

Script para migrar el campo `microservice` al nuevo formato `executor` en la colección Steps de AppWrite.

### Prerrequisitos

1. Tener las variables de entorno configuradas:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`

2. Instalar dependencias de AppWrite:
   ```bash
   npm install appwrite
   ```

### Uso

1. **Ejecutar en entorno de staging primero:**
   ```bash
   node scripts/migrate-microservice-to-executor.js
   ```

2. **Verificar los resultados** antes de ejecutar en producción

3. **Ejecutar en producción** solo después de confirmar que funciona correctamente

### ¿Qué hace el script?

1. **Lee todos los documentos** de la colección Steps
2. **Identifica documentos** que tienen el campo `microservice` pero no `executor`
3. **Transforma cada valor** de `microservice` al formato:
   ```json
   {
     "type": "microservice",
     "identifier": "[valor_del_microservice]",
     "metadata": {}
   }
   ```
4. **Actualiza cada documento** con el nuevo campo `executor`
5. **Proporciona un resumen** de la migración

### Características de seguridad

- ✅ **Confirmación interactiva** antes de ejecutar
- ✅ **Vista previa** de los cambios que se realizarán
- ✅ **Omite documentos** que ya tienen el campo `executor`
- ✅ **Manejo de errores** individual por documento
- ✅ **Resumen detallado** al finalizar
- ✅ **No elimina** el campo `microservice` (se mantiene para rollback)

### Notas importantes

- El script **NO elimina** el campo `microservice` existente
- Esto permite hacer rollback si es necesario
- Se recomienda hacer backup de la base de datos antes de ejecutar
- Ejecutar primero en un entorno de pruebas

### Rollback

Si necesitas revertir los cambios:
1. Eliminar el campo `executor` de todos los documentos
2. El campo `microservice` original permanece intacto