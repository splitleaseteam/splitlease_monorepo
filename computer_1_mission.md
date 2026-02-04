# 🖥️ COMPUTER 1 MISSION: Personalized Defaults & User Archetypes
**Token Budget:** 2,000,000
**Current Phase:** 1 - Deep Understanding

## 🎯 OBJECTIVE
Build an intelligent user archetype detection system that classifies users as **Big Spender**, **High Flex**, or **Average**, and personalizes their pricing defaults.

## 📂 RESOURCES
- **Reference Implementation:** `pattern_1/`
- **Main Codebase:** `.` (Current directory)

## 📋 PHASE 1 TASKS (Deep Understanding)
1. **Analyze Pattern 1 Code:**
   - Understand `pattern_1/backend` (Archetype logic, Supabase functions).
   - Understand `pattern_1/frontend` (TransactionSelector, Hooks).
2. **Analyze Existing Split Lease Code:**
   - Understand current User schema and Transaction history.
   - Understand `DateChangeRequestManager` flow.
3. **Develop Integration Strategy:**
   - How to merge database migrations without data loss?
   - How to inject components into the existing "Island" architecture?

## 🔑 KEY SUCCESS METRICS
- **Classification Accuracy:** >95%
- **Performance:** <100ms API response
- **Tests:** 100+ comprehensive tests

## 🛑 RULES
- **DO NOT** just copy files blindly.
- **DO** refactor for the target architecture.
- **DO** add error handling and TypeScript types.
- **DO** coordinate between Backend (Claude) and Frontend (OpenCode).
