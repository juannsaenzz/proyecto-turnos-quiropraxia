const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use regex to ignore line endings
content = content.replace(
  /const updateTurnoEstado = async \(id: number, nuevoEstado: "PENDIENTE" \| 'CONFIRMADO' \| 'ATENDIDO' \| 'AUSENTE'\) => {\s*setSelectedTurnos\(\[\]\);\s*setUpdatingStatusId\(id\);\s*try {/,
  `const updateTurnoEstado = async (id: number, nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {\n    setSelectedTurnos([]);\n    setUpdatingStatusId(id);\n    try {\n      await new Promise(resolve => setTimeout(resolve, 500));`
);

content = content.replace(
  /const handleBulkUpdateEstado = async \(nuevoEstado: "PENDIENTE" \| 'CONFIRMADO' \| 'ATENDIDO' \| 'AUSENTE'\) => {\s*if \(selectedTurnos\.length === 0\) return;\s*setIsBulkUpdating\(true\);\s*try {/,
  `const handleBulkUpdateEstado = async (nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {\n    if (selectedTurnos.length === 0) return;\n    setIsBulkUpdating(true);\n    try {\n      await new Promise(resolve => setTimeout(resolve, 500));`
);

content = content.replace(
  /      \)}\s*<\/>\s*\);\s*}\s*$/,
  `      )}

      {(updatingStatusId !== null || isBulkUpdating) && (
        <LoadingSpinner message="Actualizando estado..." />
      )}
    </>
  );
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Overlay added with Regex!");
