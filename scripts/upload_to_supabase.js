const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function uploadAndPrune() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ¡Usar el Service Role Key para permisos totales!
    const bucketName = 'backups';

    if (!supabaseUrl || !supabaseKey) {
      console.error('Faltan credenciales: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Subir el nuevo backup
    const date = new Date().toISOString().split('T')[0];
    const fileName = `quiropraxia_backup_${date}.sql`;
    console.log(`Subiendo backup ${fileName} a Supabase Storage...`);

    const fileBuffer = fs.readFileSync('backup.sql');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'application/sql',
        upsert: true, // Si por algún motivo se corre dos veces el mismo día, lo sobreescribe
      });

    if (uploadError) {
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }
    console.log('✅ Archivo subido con éxito:', fileName);

    // 2. Borrar backups viejos (más de 30 días)
    const DIAS_RETENCION = 30;
    const msRetencion = DIAS_RETENCION * 24 * 60 * 60 * 1000;
    const hace30Dias = new Date(Date.now() - msRetencion);

    console.log(`Buscando backups más antiguos que ${DIAS_RETENCION} días...`);

    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();

    if (listError) {
      throw new Error(`Error al listar archivos: ${listError.message}`);
    }

    const filesToDelete = files
      .filter((file) => {
        const fileDate = new Date(file.created_at);
        return fileDate < hace30Dias;
      })
      .map((file) => file.name);

    if (filesToDelete.length > 0) {
      console.log(`Se encontraron ${filesToDelete.length} backups antiguos para eliminar:`, filesToDelete);
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filesToDelete);

      if (deleteError) {
        throw new Error(`Error al borrar backups viejos: ${deleteError.message}`);
      }
      console.log('✅ Backups antiguos eliminados correctamente.');
    } else {
      console.log('No hay backups tan antiguos para eliminar.');
    }

  } catch (error) {
    console.error('❌ Ocurrió un error en el proceso:', error.message);
    process.exit(1);
  }
}

uploadAndPrune();
