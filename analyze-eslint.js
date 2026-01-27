const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint-output.json', 'utf8'));

// Group files by directory
const byDirectory = {};
const allFiles = [];
const categorizedWarnings = {
  react: [],
  errorBoundary: [],
  header: [],
  footer: [],
  lucide: [],
  components: [],
  hooks: [],
  errorHandling: [],
  other: []
};

data.forEach(file => {
  if (file.warningCount > 0) {
    const fullPath = file.filePath;
    const appIndex = fullPath.indexOf('app');
    const relativePath = appIndex >= 0 ? fullPath.substring(appIndex + 5) : fullPath;
    const cleanPath = relativePath.replace(/\\/g, '/');

    // Get directory
    const lastSlash = cleanPath.lastIndexOf('/');
    const dir = lastSlash > 0 ? cleanPath.substring(0, lastSlash) : 'src-root';

    if (!byDirectory[dir]) {
      byDirectory[dir] = { count: 0, files: [] };
    }
    byDirectory[dir].count += file.warningCount;

    const fileInfo = {
      path: cleanPath,
      warnings: file.warningCount,
      messages: file.messages.filter(m => m.ruleId === 'no-unused-vars').map(m => ({
        line: m.line,
        column: m.column,
        message: m.message,
        varName: m.message.match(/'([^']+)'/)?.[1] || 'unknown'
      }))
    };

    byDirectory[dir].files.push(fileInfo);
    allFiles.push(fileInfo);

    // Categorize warnings
    fileInfo.messages.forEach(msg => {
      const varName = msg.varName;
      if (varName === 'React') {
        categorizedWarnings.react.push({ file: cleanPath, ...msg });
      } else if (varName === 'ErrorBoundary') {
        categorizedWarnings.errorBoundary.push({ file: cleanPath, ...msg });
      } else if (varName === 'Header') {
        categorizedWarnings.header.push({ file: cleanPath, ...msg });
      } else if (varName === 'Footer') {
        categorizedWarnings.footer.push({ file: cleanPath, ...msg });
      } else if (['Check', 'X', 'Calendar', 'FileText', 'ChevronRight', 'Mail', 'Trash2', 'MessageSquare', 'Loader2', 'ChevronDown', 'User', 'Phone', 'CheckCircle', 'ChevronLeft', 'Clock', 'MapPin', 'Home', 'Info', 'AlertCircle', 'Plus', 'Minus', 'Search', 'Filter', 'Settings', 'Edit', 'Delete', 'Copy', 'Download', 'Upload', 'Share', 'ExternalLink', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(varName)) {
        categorizedWarnings.lucide.push({ file: cleanPath, ...msg });
      } else if (varName.endsWith('Icon') || varName.endsWith('Card') || varName.endsWith('Modal') || varName.endsWith('Button') || varName.endsWith('State') || varName.endsWith('Container') || varName.endsWith('Provider')) {
        categorizedWarnings.components.push({ file: cleanPath, ...msg });
      } else if (varName.startsWith('use')) {
        categorizedWarnings.hooks.push({ file: cleanPath, ...msg });
      } else if (['e', 'err', 'error', 'parseErr', 'result', 'data'].includes(varName)) {
        categorizedWarnings.errorHandling.push({ file: cleanPath, ...msg });
      } else {
        categorizedWarnings.other.push({ file: cleanPath, ...msg });
      }
    });
  }
});

console.log('=== WARNINGS BY DIRECTORY ===\n');
Object.entries(byDirectory)
  .sort((a, b) => b[1].count - a[1].count)
  .forEach(([dir, info]) => {
    console.log(`${dir}: ${info.count} warnings (${info.files.length} files)`);
  });

console.log('\n=== CATEGORIZED WARNINGS ===\n');
Object.entries(categorizedWarnings).forEach(([category, items]) => {
  console.log(`${category}: ${items.length} instances`);
});

console.log('\n=== FILES WITH MOST WARNINGS ===\n');
allFiles
  .sort((a, b) => b.warnings - a.warnings)
  .slice(0, 30)
  .forEach(f => console.log(`${f.path}: ${f.warnings} warnings`));

// Output detailed data to JSON for plan creation
const output = {
  summary: {
    totalFiles: allFiles.length,
    totalWarnings: allFiles.reduce((sum, f) => sum + f.warnings, 0),
    byDirectory: Object.entries(byDirectory).map(([dir, info]) => ({
      directory: dir,
      warningCount: info.count,
      fileCount: info.files.length
    })).sort((a, b) => b.warningCount - a.warningCount)
  },
  categories: {
    react: categorizedWarnings.react.length,
    errorBoundary: categorizedWarnings.errorBoundary.length,
    header: categorizedWarnings.header.length,
    footer: categorizedWarnings.footer.length,
    lucide: categorizedWarnings.lucide.length,
    components: categorizedWarnings.components.length,
    hooks: categorizedWarnings.hooks.length,
    errorHandling: categorizedWarnings.errorHandling.length,
    other: categorizedWarnings.other.length
  },
  allFiles: allFiles.sort((a, b) => a.path.localeCompare(b.path)),
  categorizedWarnings
};

fs.writeFileSync('eslint-analysis.json', JSON.stringify(output, null, 2));
console.log('\n=== Detailed analysis written to eslint-analysis.json ===');
