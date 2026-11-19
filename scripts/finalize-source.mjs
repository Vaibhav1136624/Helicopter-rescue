// Optional offline source formatting using the installed TypeScript compiler.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
for (const directory of ['src', 'tests']) {
  for (const filename of fs.readdirSync(directory).filter(file => file.endsWith('.ts'))) {
    const file = path.join(directory, filename);
    const parsed = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    fs.writeFileSync(file, printer.printFile(parsed));
  }
}
