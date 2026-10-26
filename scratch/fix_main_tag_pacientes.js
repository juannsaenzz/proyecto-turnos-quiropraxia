const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The main tag currently ends at the very bottom:
//       </main>
//     </>
//   );
// }

// We want to find where the main content ends. It ends at `</div>` before `{/* MODAL: ... */}` or `{/* TAB 3: HISTORIAL CLINICO */}` ... wait, where should it end?
// Let's look at the modals in pacientes.
// The first modal is `showNewTurnoModal` at line 1266? No, let's just find the first `{/* MODAL: ` or `{showNewTurnoModal` and put `</main>` before it!
const match = content.match(/          \{\/\* TAB 3: HISTORIAL CLINICO \*\/\}\n      \{showNewTurnoModal && \(/);
if (match) {
  content = content.replace(
    /          \{\/\* TAB 3: HISTORIAL CLINICO \*\/\}\n      \{showNewTurnoModal && \(/,
    "          </main>\n          {/* TAB 3: HISTORIAL CLINICO */}\n      {showNewTurnoModal && ("
  );
  // Now we must remove the old </main> at the bottom.
  content = content.replace(/\n      <\/main>\n    <\/>\n  \);\n}/, "\n    </>\n  );\n}");
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Moved </main> in pacientes/page.tsx");
} else {
  console.log("Could not find the insertion point.");
}
