#!/usr/bin/env python3
"""
Post-Push Verification Script
Run after any git push to verify the remote HEAD matches local HEAD.
Detects race conditions where another push landed between yours.

Usage: python .claude/hooks/verify_push.py
"""
import subprocess
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent


def get_local_head():
    """Get local HEAD commit SHA"""
    result = subprocess.run(
        ['git', 'rev-parse', 'HEAD'],
        capture_output=True, text=True, timeout=5,
        cwd=PROJECT_ROOT
    )
    return result.stdout.strip() if result.returncode == 0 else None


def get_remote_head():
    """Get remote origin/main HEAD commit SHA"""
    result = subprocess.run(
        ['git', 'ls-remote', 'origin', 'refs/heads/main'],
        capture_output=True, text=True, timeout=15,
        cwd=PROJECT_ROOT
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip().split()[0]
    return None


def main():
    machine = os.environ.get('COMPUTERNAME', os.environ.get('HOSTNAME', 'unknown'))

    local_sha = get_local_head()
    remote_sha = get_remote_head()

    if not local_sha or not remote_sha:
        print(f"[{machine}] WARNING: Could not verify push — unable to read SHA values")
        print(f"  Local HEAD:  {local_sha or 'UNKNOWN'}")
        print(f"  Remote HEAD: {remote_sha or 'UNKNOWN'}")
        sys.exit(1)

    local_short = local_sha[:7]
    remote_short = remote_sha[:7]

    if local_sha == remote_sha:
        print(f"[{machine}] VERIFIED: Remote matches local HEAD ({local_short})")
        print(f"  Cloudflare Pages will deploy commit {local_short}")
        sys.exit(0)
    else:
        print(f"[{machine}] MISMATCH DETECTED:")
        print(f"  Local HEAD:  {local_short}")
        print(f"  Remote HEAD: {remote_short}")
        print(f"  Another push may have landed after yours.")
        print(f"  The deployed commit will be {remote_short}, not {local_short}.")
        print(f"  Run: git fetch origin main && git log origin/main --oneline -5")
        sys.exit(1)


if __name__ == "__main__":
    main()
