#!/bin/bash

# Visual Validation Runner
# Simplified script to run the complete visual validation process
#
# Usage: ./scripts/run-visual-validation.sh
#
# Features:
# - Checks prerequisites
# - Starts dev server if needed
# - Runs validation
# - Opens results

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VISUAL VALIDATION - 12 ADMIN PAGES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}1. Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}⚠ Bun not found (will try npx)${NC}"
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found${NC}"

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null 2>&1; then
    echo -e "${YELLOW}Installing Playwright...${NC}"
    npm install -D playwright
fi
echo -e "${GREEN}✓ Playwright available${NC}"

echo ""
echo -e "${YELLOW}2. Checking dev server...${NC}"

# Check if dev server is running on 8001
if curl -s http://localhost:8001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server already running on :8001${NC}"
else
    echo -e "${YELLOW}Dev server not running. Start it with:${NC}"
    echo -e "${YELLOW}  bun run dev --port 8001${NC}"
    echo ""
    read -p "Start dev server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Starting dev server...${NC}"
        cd app
        bun run dev --port 8001 &
        DEV_SERVER_PID=$!
        cd ..
        echo -e "${YELLOW}Waiting for server to be ready...${NC}"
        sleep 8

        if curl -s http://localhost:8001 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Dev server is ready${NC}"
        else
            echo -e "${RED}✗ Dev server failed to start${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Dev server required to continue${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}3. Creating screenshot directory...${NC}"

mkdir -p docs/Done/visual-validation-screenshots
echo -e "${GREEN}✓ Directory created${NC}"

echo ""
echo -e "${YELLOW}4. Running visual validation...${NC}"
echo -e "${BLUE}───────────────────────────────────────────────────────────────${NC}"

# Run the validation script
if command -v bun &> /dev/null; then
    bun run scripts/visual-validation-playwright.ts
else
    npx ts-node scripts/visual-validation-playwright.ts
fi

VALIDATION_EXIT_CODE=$?

echo -e "${BLUE}───────────────────────────────────────────────────────────────${NC}"

if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Validation complete!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Review screenshots in: docs/Done/visual-validation-screenshots/"
    echo "2. Open report: docs/Done/VISUAL_VALIDATION_REPORT.md"
    echo "3. Score each page (1-5 per element)"
    echo "4. Document any issues found"
    echo "5. Calculate overall match percentages"
    echo ""

    # Offer to open report
    read -p "Open validation report? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code docs/Done/VISUAL_VALIDATION_REPORT.md
        elif command -v open &> /dev/null; then
            open docs/Done/VISUAL_VALIDATION_REPORT.md
        else
            echo "Please open: docs/Done/VISUAL_VALIDATION_REPORT.md"
        fi
    fi
else
    echo ""
    echo -e "${RED}✗ Validation failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

# Clean up dev server if we started it
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo ""
    echo -e "${YELLOW}Stopping dev server...${NC}"
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}Done!${NC}"
