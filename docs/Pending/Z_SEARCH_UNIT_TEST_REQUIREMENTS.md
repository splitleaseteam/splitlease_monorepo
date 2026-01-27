# COMPREHENSIVE REQUIREMENTS DOCUMENT

## Bubble to Code Migration: z-search-unit-test Page

**Split Lease Application - Production Environment**  
**Date:** January 12, 2026  
**Page Name:** z-search-unit-test  
**Purpose:** Unit testing page for search and listing filtering functionality

---

## 1. EXECUTIVE SUMMARY

This page serves as a unit test environment for the search and listing filtering system in the Split Lease application. It provides a comprehensive interface for testing various search parameters including:
- Geographic filters (Boroughs and Neighborhoods)
- Temporal filters (Days/Nights availability)
- Schedule pattern selection
- Listing attribute filters (Active, Approved, Complete, Default)
- Sorting and price filtering

---

## 3. DETAILED ELEMENT BREAKDOWN

### 3.2 FILTERS SECTION

#### A. BOROUGHS DROPDOWN (D: Search Location - borough)
- **Element Type:** Dropdown
- **Placeholder:** "Borough"
- **Type of Choices:** ZAT-Geo-Borough-Top level
- **Conditionals:** 6 conditions for focus, validation, hover, URL parameters

#### B. NEIGHBORHOODS SEARCHBOX
- **Element Type:** Searchbox
- **Type of Choices:** ZAT-Geo-Hood-Medium-Level

#### C. SCHEDULE SELECTOR (Reusable Component)
- **Component Name:** ⚛️ Search Schedule Selector
- **Selection Type:** Multi-select toggles for days of week

---

## 4. LISTINGS DISPLAY SECTION

### 4.1 PRIMARY LISTINGS REPEATING GROUP

**Element Name:** RG: Listing Borough  
**Description:** "All listings - Filtered by borough, filtered by search selector, filtered by weekly pattern"

**FILTERS APPLIED (Sequential):**
1. Filtered by Borough
2. Filtered by Search Schedule Selector
3. Filtered by Weekly Pattern
4. Neighborhood Filter (Optional)
5. Price Filter (Optional)

---

## 9. SEARCH ALGORITHM & FILTER LOGIC

### 9.2 KEY SEARCH EXPRESSIONS

**Main Listing Search:**
```sql
SEARCH Listings WHERE:
  Location-Borough = [Selected Borough]
  AND Nights_Available CONTAINS [Selected Nights]
  AND Nights_Not_Available NOT_OVERLAPS [Selected Nights]
  AND Days_Available CONTAINS [Selected Days]
  AND Days_Not_Available NOT_OVERLAPS [Selected Days]
  AND [Weekly Pattern Match]
ORDER BY [Sort Option]
```

---

## 14. MIGRATION STRATEGY RECOMMENDATIONS

**PHASED APPROACH:**
1. Phase 1: Core Data Layer
2. Phase 2: API Layer
3. Phase 3: Component Library
4. Phase 4: Page Assembly
5. Phase 5: Testing & Optimization
