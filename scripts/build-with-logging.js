#!/usr/bin/env node
/**
 * Build wrapper that logs all output to timestamped files
 * Logs saved to: z_build_logs/<YYYYMMDD_HHMMSS>_<HOSTNAME>.log
 */

import { spawn } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { hostname } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const logsDir = join(projectRoot, 'z_build_logs');

// Ensure logs directory exists
mkdirSync(logsDir, { recursive: true });

// Generate timestamp: YYYYMMDD_HHMMSS
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[-:]/g, '')
  .replace('T', '_')
  .slice(0, 15);

// Get hostname (sanitize for filename)
const host = hostname().replace(/[^a-zA-Z0-9-_]/g, '_');

// Log filename
const logFilename = `${timestamp}_${host}.log`;
const logPath = join(logsDir, logFilename);

// Create write stream
const logStream = createWriteStream(logPath, { flags: 'a' });

// Write header
const header = `
================================================================================
BUILD LOG
================================================================================
Hostname:   ${hostname()}
Timestamp:  ${now.toISOString()}
Command:    cd app && bun install --frozen-lockfile && bun run build
================================================================================

`;

logStream.write(header);
console.log(header);

// Track timing
const startTime = Date.now();

// Run build command
const buildProcess = spawn('bun', ['run', 'build'], {
  cwd: join(projectRoot, 'app'),
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '1' }
});

// Capture stdout
buildProcess.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  logStream.write(text);
});

// Capture stderr
buildProcess.stderr.on('data', (data) => {
  const text = data.toString();
  process.stderr.write(text);
  logStream.write(`[STDERR] ${text}`);
});

// Handle completion
buildProcess.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  const footer = `
================================================================================
BUILD ${code === 0 ? 'COMPLETED' : 'FAILED'}
================================================================================
Exit Code:  ${code}
Duration:   ${duration}s
Log File:   ${logPath}
================================================================================
`;

  logStream.write(footer);
  console.log(footer);

  logStream.end(() => {
    process.exit(code);
  });
});

// Handle errors
buildProcess.on('error', (error) => {
  const errorMsg = `\n[ERROR] Failed to start build: ${error.message}\n`;
  logStream.write(errorMsg);
  console.error(errorMsg);
  logStream.end(() => {
    process.exit(1);
  });
});
