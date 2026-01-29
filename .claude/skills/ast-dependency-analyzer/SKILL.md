---
name: ast-dependency-analyzer
description: |
  Analyzes JavaScript/TypeScript codebases using tree-sitter AST parsing to extract exports, imports,
  and build complete dependency graphs. Use when: (1) Detecting barrel/hub files, (2) Finding circular
  dependencies, (3) Identifying orphaned files, (4) Analyzing import patterns, (5) Understanding codebase
  structure before refactoring. Returns DependencyContext with symbol_table, dependency_graph, and
  reverse_dependencies.
---

# AST Dependency Analyzer

Analyzes JavaScript/TypeScript codebases using tree-sitter AST parsing to extract exports, imports, and build complete dependency graphs.

## When to Use

Use this skill when you need to:
- **Detect barrel files** - Find files that re-export from other modules
- **Find hub files** - Identify files that many others depend on
- **Trace dependencies** - Understand what imports from what
- **Find circular dependencies** - Detect import cycles
- **Identify orphaned files** - Find files nothing imports from
- **Plan refactoring** - Understand dependency structure before changes
- **Validate imports** - Ensure all imports resolve correctly

## What It Analyzes

**Languages:** JavaScript (.js, .jsx, .mjs, .cjs) and TypeScript (.ts, .tsx)

**Extracts from each file:**
- All exports (named, default, re-exports, type exports)
- All imports (named, default, namespace, side-effect, dynamic)
- Resolved import paths
- Line numbers for each export/import

**Builds:**
- `symbol_table` - What each file exports
- `dependency_graph` - What each file imports (and from where)
- `reverse_dependencies` - Who depends on each file (reverse lookup)

## Quick Start

```bash
# Navigate to project root
cd "c:\Users\Split Lease\Documents\Split Lease - Team"

# Run analysis
python -c "
import sys
sys.path.insert(0, '.claude/skills/ast-dependency-analyzer')
from ast_dependency_analyzer import analyze_dependencies

# Analyze directory (returns DependencyContext)
context = analyze_dependencies('app/src', force_refresh=True)

# Get markdown output for prompts
print(context.to_prompt_context())
"
```

**Alternative (as package):**
```python
# If added to PYTHONPATH or installed
from ast_dependency_analyzer import analyze_dependencies, validate_file_after_write

context = analyze_dependencies("app/src")
print(context.to_prompt_context())
```

**Caching:** The analyzer caches results by date. Use `force_refresh=True` to re-analyze.

## Output Structure

### DependencyContext Object

```python
@dataclass
class DependencyContext:
    root_dir: str                              # Directory analyzed
    symbol_table: Dict[str, List[ExportedSymbol]]       # What each file exports
    dependency_graph: Dict[str, List[ImportedSymbol]]   # What each file imports
    reverse_dependencies: Dict[str, List[str]]          # Who imports from each file
    total_files: int
    total_exports: int
    total_imports: int
    analysis_timestamp: str
    parse_error_count: int
    content_hash: str                          # For cache validation
```

### ExportedSymbol

```python
@dataclass
class ExportedSymbol:
    name: str                    # The exported name
    export_type: ExportType      # "named", "default", "re-export", "declaration", "type"
    line: int                    # Line number (1-based)
    source_file: Optional[str]   # For re-exports, the source module
    original_name: Optional[str] # For aliased exports
```

### ImportedSymbol

```python
@dataclass
class ImportedSymbol:
    name: str                    # The imported symbol name (or '*' for namespace)
    import_type: ImportType      # "named", "default", "namespace", "side-effect", "dynamic", "type"
    source: str                  # The module specifier as written
    resolved_path: Optional[str] # Resolved absolute path (None for node_modules)
    line: int                    # Line number (1-based)
    alias: Optional[str]         # For aliased imports
```

## Common Analysis Patterns

### Find Barrel Files (Re-exporters)

Barrel files have `export_type = "re-export"`:

```python
barrels = []
for file_path, exports in context.symbol_table.items():
    re_exports = [e for e in exports if e.export_type == "re-export"]
    if re_exports:
        barrels.append({
            'file': file_path,
            're_export_count': len(re_exports),
            'is_pure': all(e.export_type == "re-export" for e in exports),
            'consumers': len(context.reverse_dependencies.get(file_path, []))
        })
```

### Find Hub Files (Highly Depended Upon)

```python
hubs = []
for file_path, dependents in context.reverse_dependencies.items():
    if len(dependents) >= 10:  # Threshold for "hub"
        hubs.append({
            'file': file_path,
            'consumer_count': len(dependents),
            'consumers': dependents
        })

# Sort by consumer count (descending)
hubs.sort(key=lambda x: x['consumer_count'], reverse=True)
```

### Find Orphaned Files (Nothing Imports From)

```python
orphans = []
for file_path in context.symbol_table.keys():
    dependents = context.reverse_dependencies.get(file_path, [])
    if len(dependents) == 0:
        orphans.append(file_path)
```

### Find Circular Dependencies

```python
def find_cycles(context, start_file, visited=None, path=None):
    if visited is None:
        visited = set()
    if path is None:
        path = []

    if start_file in path:
        cycle_start = path.index(start_file)
        return path[cycle_start:]

    if start_file in visited:
        return None

    visited.add(start_file)
    path.append(start_file)

    # Get dependencies
    imports = context.dependency_graph.get(start_file, [])
    for imp in imports:
        if imp.resolved_path:
            cycle = find_cycles(context, imp.resolved_path, visited, path)
            if cycle:
                return cycle

    path.pop()
    return None

# Check all files for cycles
all_cycles = []
for file_path in context.symbol_table.keys():
    cycle = find_cycles(context, file_path)
    if cycle:
        all_cycles.append(cycle)
```

### Get All Consumers of a File

```python
def get_consumers(context, file_path):
    """Get all files that import from the given file."""
    return context.reverse_dependencies.get(file_path, [])

# Example:
consumers = get_consumers(context, 'app/src/lib/utils.js')
print(f"utils.js is imported by {len(consumers)} files")
```

### Get All Dependencies of a File

```python
def get_dependencies(context, file_path):
    """Get all files that the given file imports from."""
    imports = context.dependency_graph.get(file_path, [])
    return [imp.resolved_path for imp in imports if imp.resolved_path]

# Example:
deps = get_dependencies(context, 'app/src/pages/HomePage.jsx')
print(f"HomePage.jsx imports from {len(deps)} files")
```

## Export Types Reference

| Type | Example | Indicates |
|------|---------|-----------|
| `re-export` | `export { foo } from './bar'` | **Barrel file** - re-exports from another module |
| `named` | `export { foo, bar }` | Local exports defined in this file |
| `default` | `export default function()` | Local default export |
| `declaration` | `export const foo = ...` | Local export declaration |
| `type` | `export type { Foo }` | TypeScript type-only export |

**Barrel Detection:**
- **Pure barrel**: All exports are `re-export` type
- **Mixed barrel**: Has `re-export` AND other export types
- **Not a barrel**: No `re-export` exports

## Import Types Reference

| Type | Example | Description |
|------|---------|-------------|
| `named` | `import { foo } from './mod'` | Named import |
| `default` | `import foo from './mod'` | Default import |
| `namespace` | `import * as foo from './mod'` | Namespace import |
| `side-effect` | `import './styles.css'` | Side-effect import (no bindings) |
| `dynamic` | `await import('./mod')` | Dynamic import |
| `type` | `import type { Foo }` | TypeScript type-only import |

## API Reference

### analyze_dependencies()

Main entry point for analysis.

```python
analyze_dependencies(
    target_path: str,           # Directory to analyze (e.g., "app/src")
    cache_dir: Optional[str] = None,     # Override default cache location
    force_refresh: bool = False,         # Bypass cache and re-analyze
    max_age_hours: int = 24             # Maximum cache age
) -> DependencyContext
```

**Caching behavior:**
- Creates cache file: `ast_cache/<dirname>-<YYMMDD>.json`
- Reuses cache if file contents unchanged (via content hash)
- Keeps last 3 days of cache automatically

### DependencyContext Methods

```python
# Get files that depend on this file
context.get_dependents(file_path: str) -> List[str]

# Get files this file depends on
context.get_dependencies(file_path: str) -> List[str]

# Get exported symbol names
context.get_exports(file_path: str) -> List[str]

# Format as markdown for prompts
context.to_prompt_context() -> str

# Convert to JSON for storage
context.to_json_dict() -> dict
```

## Example: Complete Barrel Detection

```python
import sys
sys.path.insert(0, '.claude/skills/ast-dependency-analyzer')
from ast_dependency_analyzer import analyze_dependencies

# Analyze
context = analyze_dependencies('app/src', force_refresh=True)

# Find barrels
barrels = []
for file_path, exports in context.symbol_table.items():
    re_exports = [e for e in exports if e.export_type.value == "re-export"]

    if re_exports:
        other_exports = [e for e in exports if e.export_type.value != "re-export"]
        consumers = context.reverse_dependencies.get(file_path, [])

        barrels.append({
            'file': file_path,
            're_export_count': len(re_exports),
            'has_star_export': any(e.name == '*' for e in re_exports),
            'is_pure': len(other_exports) == 0,
            'consumer_count': len(consumers),
            'severity': 'high' if len(consumers) >= 20 or any(e.name == '*' for e in re_exports) else 'medium' if len(consumers) >= 10 else 'low'
        })

# Print results
for barrel in sorted(barrels, key=lambda x: x['consumer_count'], reverse=True):
    print(f"{barrel['file']}: {barrel['consumer_count']} consumers, {barrel['severity']} severity")
```

## Use Cases by Task

| Task | What to Analyze | Key Fields |
|------|-----------------|------------|
| **Barrel detection** | `symbol_table` for `export_type="re-export"` | `export_type`, `reverse_dependencies` |
| **Hub detection** | `reverse_dependencies` for high counts | `reverse_dependencies` |
| **Orphan detection** | `reverse_dependencies` for zero counts | `reverse_dependencies` |
| **Circular deps** | `dependency_graph` for cycles | `dependency_graph` |
| **Impact analysis** | `reverse_dependencies` before changes | `reverse_dependencies` |
| **Unused code** | `symbol_table` vs `reverse_dependencies` | Both |

## Notes

- **Parse errors**: Check `context.parse_error_count` - files with syntax errors are skipped
- **Node modules**: External packages (not starting with `.` or `@/`) have `resolved_path = None`
- **Type imports**: Included in analysis but may not affect runtime behavior
- **Cache location**: Defaults to `ast_cache/` relative to the analyzer module (`.claude/skills/ast-dependency-analyzer/ast_cache/`)
