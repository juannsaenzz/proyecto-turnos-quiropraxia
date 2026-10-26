const fs = require('fs');

const files = [
  'frontend/src/app/admin/turnos/page.tsx',
  'frontend/src/app/admin/pacientes/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace case 1: case 3: case 4: with case 1: case 3: case 5:
  content = content.replace(/case 1:\s*case 3:\s*case 4:/g, 'case 1: case 3: case 5:');
  
  // Replace standalone case 5: with case 4: (this happens in 3 places)
  // First, swap "case 5: // Viernes" and "case 4: // Jueves"
  content = content.replace(/case 5: \/\/ Viernes/g, 'TEMP_CASE_5');
  content = content.replace(/case 4: \/\/ Jueves/g, 'case 5: // Viernes');
  content = content.replace(/TEMP_CASE_5/g, 'case 4: // Jueves');

  // Next, swap case 5: defaultCity and case 4:
  content = content.replace(/case 5:\n(\s*)if \(selectedShift === 'Mañana'\) defaultCity = "Gualeguay";/g, 'case 4:\n$1if (selectedShift === \'Mañana\') defaultCity = "Gualeguay";');
  
  content = content.replace(/case 1: case 3: case 4:\n(\s*)return newShift === 'Mañana' \? 'Cerrado' : "Rosario del Tala";/g, 'case 1: case 3: case 5:\n$1return newShift === \'Mañana\' ? \'Cerrado\' : "Rosario del Tala";');
  content = content.replace(/case 5:\n(\s*)return newShift === 'Mañana' \? 'Gualeguay' : "Galarza";/g, 'case 4:\n$1return newShift === \'Mañana\' ? \'Gualeguay\' : "Galarza";');

  // In check for day === 5
  content = content.replace(/if \(day === 5\)/g, 'if (day === 4)');
  content = content.replace(/isFriday = dateObj\.getDay\(\) === 5/g, 'isThursday = dateObj.getDay() === 4');
  content = content.replace(/isFriday = new Date\(currentDate \+ "T00:00:00"\)\.getDay\(\) === 5/g, 'isThursday = new Date(currentDate + "T00:00:00").getDay() === 4');
  
  // Replace isFriday with isThursday everywhere
  content = content.replace(/isFriday/g, 'isThursday');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
