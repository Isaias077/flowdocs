/**
 * Script de migración para transformar el campo 'microservice' al nuevo formato 'executor'
 * en la colección Steps de AppWrite
 */

const { Client, Databases, Query } = require('appwrite');
const readline = require('readline');

// Configuración de AppWrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// IDs de la base de datos y colección
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const STEPS_COLLECTION_ID = '68866da8002a5a5eeb2a';

// Función para confirmar la migración
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Función principal de migración
async function migrateSteps() {
  try {
    console.log('🔍 Iniciando migración de microservice a executor...');
    
    // Obtener todos los documentos de la colección Steps
    console.log('📋 Obteniendo todos los steps...');
    const response = await databases.listDocuments(
      DATABASE_ID,
      STEPS_COLLECTION_ID,
      [Query.limit(1000)] // Ajustar según sea necesario
    );

    const steps = response.documents;
    console.log(`📊 Encontrados ${steps.length} steps para migrar`);

    if (steps.length === 0) {
      console.log('✅ No hay steps para migrar');
      return;
    }

    // Mostrar algunos ejemplos de lo que se va a migrar
    console.log('\n📝 Ejemplos de migración:');
    steps.slice(0, 3).forEach((step, index) => {
      if (step.microservice) {
        console.log(`${index + 1}. "${step.microservice}" → {"type": "microservice", "identifier": "${step.microservice}", "metadata": {}}`);
      }
    });

    // Confirmar migración
    const confirmed = await askConfirmation('\n❓ ¿Continuar con la migración? (y/N): ');
    if (!confirmed) {
      console.log('❌ Migración cancelada');
      return;
    }

    // Procesar cada step
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const step of steps) {
      try {
        // Verificar si ya tiene el campo executor
        if (step.executor) {
          console.log(`⏭️  Step "${step.name}" ya tiene executor, omitiendo...`);
          skippedCount++;
          continue;
        }

        // Verificar si tiene microservice para migrar
        if (!step.microservice) {
          console.log(`⚠️  Step "${step.name}" no tiene microservice, omitiendo...`);
          skippedCount++;
          continue;
        }

        // Crear el objeto executor
        const executorObject = {
          type: 'microservice',
          identifier: step.microservice,
          metadata: {}
        };

        // Actualizar el documento
        await databases.updateDocument(
          DATABASE_ID,
          STEPS_COLLECTION_ID,
          step.$id,
          {
            executor: JSON.stringify(executorObject)
          }
        );

        console.log(`✅ Migrado: "${step.name}" - ${step.microservice}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrando step "${step.name}": ${error.message}`);
        errorCount++;
      }
    }

    // Resumen final
    console.log('\n📊 Resumen de migración:');
    console.log(`✅ Migrados exitosamente: ${migratedCount}`);
    console.log(`⏭️  Omitidos: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📋 Total procesados: ${steps.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
    } else {
      console.log('\n⚠️  Migración completada con algunos errores. Revisar logs.');
    }

  } catch (error) {
    console.error('💥 Error fatal durante la migración:', error.message);
    process.exit(1);
  }
}

// Verificar variables de entorno
if (!DATABASE_ID) {
  console.error('❌ Error: NEXT_PUBLIC_APPWRITE_DATABASE_ID no está configurado');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  console.error('❌ Error: NEXT_PUBLIC_APPWRITE_PROJECT_ID no está configurado');
  process.exit(1);
}

// Ejecutar migración
migrateSteps().catch(console.error);