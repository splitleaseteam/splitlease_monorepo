#!/bin/bash
# PythonAnywhere Dependency Installation Script
# Run this in PythonAnywhere bash console: bash install_dependencies.sh

echo "============================================================"
echo "Installing Flask App Dependencies for PythonAnywhere"
echo "============================================================"
echo ""

# Core Flask packages (small, fast)
echo "📦 Step 1/6: Installing Flask CORS..."
pip3 install --user flask-cors
echo ""

# Supabase client (small)
echo "📦 Step 2/6: Installing Supabase..."
pip3 install --user supabase
echo ""

# H3 geospatial library (small)
echo "📦 Step 3/6: Installing H3..."
pip3 install --user h3
echo ""

# LightGBM (medium size, ~50MB)
echo "📦 Step 4/6: Installing LightGBM..."
echo "⚠️  This may take a few minutes..."
pip3 install --user lightgbm
echo ""

# Fix sentence-transformers incompatibility
echo "📦 Step 5/6: Fixing sentence-transformers..."
echo "⚠️  Upgrading transformers to fix compatibility issue..."
pip3 install --user --upgrade transformers
pip3 install --user --upgrade sentence-transformers
echo ""

# Verify installation
echo "📦 Step 6/6: Verifying installation..."
python3 << 'EOF'
import sys
print("\n" + "="*60)
print("VERIFICATION")
print("="*60)

packages = [
    'flask_cors',
    'supabase',
    'h3',
    'lightgbm',
    'sentence_transformers'
]

failed = []
for pkg in packages:
    try:
        __import__(pkg)
        print(f"✅ {pkg:30s} OK")
    except Exception as e:
        print(f"❌ {pkg:30s} FAILED: {e}")
        failed.append(pkg)

print("="*60)
if failed:
    print(f"❌ {len(failed)} package(s) still have issues: {', '.join(failed)}")
    sys.exit(1)
else:
    print("✅ All packages installed successfully!")
    print("\nYou can now reload your web app.")
    sys.exit(0)
EOF

echo ""
echo "============================================================"
echo "Installation Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Run: python test_imports.py"
echo "2. If all pass, reload your web app"
echo "3. Test: curl https://push-SplitLease.pythonanywhere.com/health"
echo ""
