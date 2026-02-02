# Loom Video Analysis Task

Navigate to each of these 5 Loom videos and capture screenshots and accessibility snapshots:

1. https://www.loom.com/share/931366d0a01643008f0a6f645a7a1b1d
2. https://www.loom.com/share/32f0a34f9c4141d0a850f17a6495b3c7
3. https://www.loom.com/share/39132202a3074c9c8301ec5a0b0a4389
4. https://www.loom.com/share/383d134a685e40f09a01ff8f4a45d45e
5. https://www.loom.com/share/e9396fc22e114a0c8f59811473b9869e

## Steps for each video:

1. Navigate to the URL
2. Take accessibility snapshot (save to `.claude/loom-analysis/video[N]-snapshot.json`)
3. Take screenshot (save to `.claude/loom-analysis/video[N]-screenshot.png`)
4. Extract page text content (save to `.claude/loom-analysis/video[N]-text.txt`)
5. Get page title and URL
6. Look for video duration if available
7. Check for transcript, comments, description text

## Tools to use:

- `mcp__playwright__browser_navigate` - Go to URL
- `mcp__playwright__browser_snapshot` - Get accessibility tree (save to file)
- `mcp__playwright__browser_take_screenshot` - Capture visual
- `mcp__playwright__browser_evaluate` - Extract text content and metadata

Output directory: `C:\Users\Split Lease\Google Drive\_Agent Context and Tools\SL16\Split Lease\.claude\loom-analysis\`
