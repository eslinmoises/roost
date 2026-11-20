// AST scan for JSX text and presentation strings, including conditional branches.
// Run from the repository root: node scripts/scan-i18n.cjs
const fs = require('node:fs');
const ts = require('typescript');
const files = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
const hits = [];
const visibleProps = new Set(['placeholder', 'title', 'label', 'submitLabel', 'aria-label', 'alt']);
for (const file of files('src').filter(path => path.endsWith('.tsx') && !/\.(test|spec)\./.test(path))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    let value;
    let reason;
    if (ts.isJsxText(node) && /[A-Za-z]/.test(node.text)) value = node.text.replace(/\s+/g, ' ').trim();
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      let ancestor = node.parent;
      let visible = false;
      let blocked = false;
      while (ancestor) {
        if (ts.isJsxExpression(ancestor)) visible = true;
        if (ts.isCallExpression(ancestor) && ancestor.expression.getText(source) === 't') blocked = true;
        if (ts.isCallExpression(ancestor) && /^console\./.test(ancestor.expression.getText(source))) blocked = true;
        if (ts.isImportDeclaration(ancestor) || ts.isExportDeclaration(ancestor) || ts.isLiteralTypeNode(ancestor)) blocked = true;
        if (ts.isJsxAttribute(ancestor)) {
          if (visibleProps.has(ancestor.name.text)) visible = true;
          else blocked = true;
        }
        if (ts.isBinaryExpression(ancestor) && /^(===|!==|==|!=)$/.test(ancestor.operatorToken.getText(source))) blocked = true;
        ancestor = ancestor.parent;
      }
      // Also inspect label maps, default parameters and helper-generated text.
      // Technical title-case literals are classified below rather than silently ignored.
      if ((visible || /^[A-Z][a-z]/.test(node.text)) && !blocked && /[A-Za-z]/.test(node.text)) value = node.text;
    }
    if (value) {
      let ancestor = node.parent;
      while (ancestor && !ts.isStatement(ancestor)) {
        if (ts.isJsxElement(ancestor) && ancestor.openingElement.tagName.getText(source) === 'style') reason = 'CSS rules, not rendered UI text';
        if (ts.isCallExpression(ancestor)) {
          const name = ancestor.expression.getText(source);
          if (name === 'format') reason = 'date-fns formatting token; the formatter supplies the active locale';
          if (name.endsWith('.toLocaleDateString')) reason = 'Intl formatting option, not displayed text';
          if (name.endsWith('.startsWith') && value === 'image/') reason = 'MIME type predicate';
          if (name === 'renderUserRow') reason = 'Internal list identifier passed to the row helper';
        }
        if (ts.isArrayLiteralExpression(ancestor) && ['all', 'going', 'maybe', 'not_going', 'newest', 'popular', 'trending', 'user', 'moderator', 'admin', 'superadmin'].includes(value)) reason = 'Filter or database enum; its display label is translated separately';
        if (ts.isPropertyAssignment(ancestor) && ['key', 'id', 'value'].includes(ancestor.name.getText(source))) reason = 'API field or feature identifier; its display label is translated separately';
        if (ts.isElementAccessExpression(ancestor) && ['pending', 'user'].includes(value)) reason = 'Database enum used to look up translated display metadata';
        if (ts.isVariableDeclaration(ancestor) && value === 'all' && ancestor.name.getText(source) === 'value') reason = 'FeatureAccess enum fallback';
        ancestor = ancestor.parent;
      }
      if (/^https?:\/\//.test(value)) reason = 'Example URL, retained in its valid machine-readable form';
      if (/^#[\da-f]{6}$/i.test(value)) reason = 'Color input example, not prose';
      if (value === 'support@example.com') reason = 'Example email address';
      if (['johndoe', 'admin', 'javascript-developers'].includes(value) && ts.isJsxAttribute(node.parent)) reason = 'Example username or route slug';
      if (value === '/classrooms/') reason = 'Literal route prefix; routes must not be translated';
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(value)) reason = 'DOM keyboard event identifier';
      if (['Content-Type', 'Authorization'].includes(value)) reason = 'HTTP header name';
      if (value === 'Roost') reason = 'Product brand name';
      if (/\b(?:bg|text|border|dark|hover|flex|grid|gap|rounded|ring|font)[-:]/.test(value)) reason = 'CSS class tokens';
      hits.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, text: value.replace(/\s+/g, ' ').trim(), reason: reason ?? 'UNEXPLAINED' });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const unexplained = hits.filter(hit => hit.reason === 'UNEXPLAINED').length;
const result = { remaining: hits.length, unexplained, hits };
if (process.argv[2]) {
  fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ remaining: hits.length, unexplained }));
} else console.log(JSON.stringify(result, null, 2));
process.exitCode = unexplained ? 1 : 0;
