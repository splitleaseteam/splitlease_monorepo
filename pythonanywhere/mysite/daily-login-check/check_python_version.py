"""
Quick script to check Python version on PythonAnywhere
Run this first to see which Python version you have available
"""

import sys

print("=" * 60)
print("PYTHON VERSION CHECKER")
print("=" * 60)
print(f"Python version: {sys.version}")
print(f"Version info: {sys.version_info}")
print()
print(f"Major: {sys.version_info.major}")
print(f"Minor: {sys.version_info.minor}")
print(f"Micro: {sys.version_info.micro}")
print()

if sys.version_info >= (3, 9):
    print("[OK] Your Python version is compatible with this script!")
    print("     (Requires Python 3.9 or higher)")
else:
    print("[WARNING] Your Python version might be too old.")
    print("          This script requires Python 3.9 or higher")
    print()
    print("Try running with: python3.9 or python3.10")

print("=" * 60)
