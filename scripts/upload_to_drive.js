const fs = require('fs');
const { google } = require('googleapis');

async function uploadFile() {
  try {
    const credentialsStr = process.env.GDRIVE_CREDENTIALS;
    const folderId = process.env.GDRIVE_FOLDER_ID;

    if (!credentialsStr || !folderId) {
      console.error('Faltan credenciales (GDRIVE_CREDENTIALS) o el ID de la carpeta (GDRIVE_FOLDER_ID).');
      process.exit(1);
    }

    const credentials = JSON.parse(credentialsStr);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const date = new Date().toISOString().split('T')[0];
    const fileName = `quiropraxia_backup_${date}.sql`;

    const fileMetadata = {
      name: fileName,
      parents: [folderId], // ID de la carpeta en Drive donde se guardará el backup
    };

    const media = {
      mimeType: 'application/sql',
      body: fs.createReadStream('backup.sql'),
    };

    console.log(`Subiendo archivo ${fileName} a Google Drive...`);

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    console.log('Archivo subido con éxito. ID de Drive:', file.data.id);
  } catch (error) {
    console.error('Ocurrió un error al subir el archivo a Google Drive:', error);
    process.exit(1);
  }
}

uploadFile();
