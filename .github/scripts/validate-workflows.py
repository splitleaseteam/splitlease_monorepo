#!/usr/bin/env python3
"""
CI/CD Workflow Validation Script
Validates all GitHub Actions YAML files for syntax errors
"""

import yaml
import sys
from pathlib import Path

def validate_yaml_file(file_path):
    """Validate a single YAML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            yaml.safe_load(f)
        return True, None
    except yaml.YAMLError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def main():
    workflows_dir = Path(__file__).parent.parent / 'workflows'

    print("=" * 60)
    print("GitHub Actions Workflow Validation")
    print("=" * 60)
    print()

    workflow_files = list(workflows_dir.glob('*.yml')) + list(workflows_dir.glob('*.yaml'))

    if not workflow_files:
        print("[FAIL] No workflow files found in .github/workflows/")
        return 1

    print(f"Found {len(workflow_files)} workflow file(s):")
    print()

    all_valid = True
    results = []

    for workflow_file in sorted(workflow_files):
        file_name = workflow_file.name
        is_valid, error = validate_yaml_file(workflow_file)

        if is_valid:
            results.append(('[OK]', file_name, 'Valid'))
        else:
            results.append(('[FAIL]', file_name, f'INVALID: {error}'))
            all_valid = False

    # Print results table
    for status, name, message in results:
        print(f"{status:<8} {name:<40} {message}")

    print()
    print("=" * 60)

    if all_valid:
        print("[SUCCESS] All workflow files are syntactically valid!")
        print("=" * 60)
        return 0
    else:
        print("[FAILURE] Some workflow files have syntax errors!")
        print("=" * 60)
        return 1

if __name__ == '__main__':
    sys.exit(main())
