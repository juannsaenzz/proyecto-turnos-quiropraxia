const fs = require('fs');

const files = [
  'frontend/src/app/admin/turnos/page.tsx',
  'frontend/src/app/admin/pacientes/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/case 5:\r?\n(\s*)if \(selectedShift === 'Mañana'\) defaultCity = "Gualeguay";/g, 'case 4:\n$1if (selectedShift === \'Mañana\') defaultCity = "Gualeguay";');
  
  content = content.replace(/case 1: case 3: case 5:\r?\n(\s*)return newShift === 'Mañana' \? 'Cerrado' : "Rosario del Tala";/g, 'case 1: case 3: case 5:\n$1return newShift === \'Mañana\' ? \'Cerrado\' : "Rosario del Tala";');
  
  content = content.replace(/case 5:\r?\n(\s*)return newShift === 'Mañana' \? 'Gualeguay' : "Galarza";/g, 'case 4:\n$1return newShift === \'Mañana\' ? \'Gualeguay\' : "Galarza";');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
