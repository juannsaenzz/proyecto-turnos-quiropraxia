const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `  useEffect(() => {
    setVisiblePacientesCount(10);
  }, [searchQuery, sortOption]);
  
  // Sort state
  const [sortOption, setSortOption] = useState<'A-Z' | 'Z-A' | 'turnos-asc' | 'turnos-desc'>('A-Z');`;

const newBlock = `  // Sort state
  const [sortOption, setSortOption] = useState<'A-Z' | 'Z-A' | 'turnos-asc' | 'turnos-desc'>('A-Z');

  useEffect(() => {
    setVisiblePacientesCount(10);
  }, [searchQuery, sortOption]);`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed block-scoped variable error.');
