"""
AST Dependency Analyzer Skill

A standalone package for analyzing JavaScript/TypeScript codebases using:
- tree-sitter AST parsing for exports/imports/dependencies
- TypeScript compiler API for validation

Usage:
    from ast_dependency_analyzer import analyze_dependencies

    context = analyze_dependencies("app/src")
    print(context.to_prompt_context())
"""

from .ast_types import (
    DependencyContext,
    FileAnalysis,
    ExportedSymbol,
    ImportedSymbol,
    ExportType,
    ImportType,
    SUPPORTED_EXTENSIONS,
    is_refactorable_file,
)

from .ast_dependency_analyzer import (
    ASTDependencyAnalyzer,
    analyze_dependencies,
)

from .lsp_validator import (
    LSPDiagnostic,
    ImportValidation,
    SymbolValidation,
    LSPValidationResult,
    extract_imports_from_code,
    extract_function_calls,
    get_file_diagnostics,
    validate_imports_exist,
    validate_refactored_code,
    validate_file_after_write,
    find_all_references,
    run_eslint_on_file,
)

__all__ = [
    # Types
    "DependencyContext",
    "FileAnalysis",
    "ExportedSymbol",
    "ImportedSymbol",
    "ExportType",
    "ImportType",
    "SUPPORTED_EXTENSIONS",
    "is_refactorable_file",
    # Analyzer
    "ASTDependencyAnalyzer",
    "analyze_dependencies",
    # LSP Validator
    "LSPDiagnostic",
    "ImportValidation",
    "SymbolValidation",
    "LSPValidationResult",
    "extract_imports_from_code",
    "extract_function_calls",
    "get_file_diagnostics",
    "validate_imports_exist",
    "validate_refactored_code",
    "validate_file_after_write",
    "find_all_references",
    "run_eslint_on_file",
]
