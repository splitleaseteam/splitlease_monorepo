# Next Steps: Supabase MCP Session

Purpose: Confirm live schema/details via Supabase MCP, then continue implementation.

## 0) Required Inputs

- Supabase MCP tool name
- Payload format + auth fields
- Whether MCP supports SQL or table read operations

## 1) MCP Queries (Schema + Sample Data)

### 1.1 Avg days per month configuration

Target: `reference_table.zat_priceconfiguration`

Expected column: `Avg days per month`

Goal: confirm exact column name, type, and sample value.

Query (SQL if supported):

```sql
select
  "Avg days per month"
from reference_table.zat_priceconfiguration
limit 1;
```

If MCP is table-read only, fetch first row and confirm the key name and value.

### 1.2 pricing_list schema + structure

Target: `public.pricing_list`

Expected arrays:
- `Nightly Price`
- `Host Compensation`

Goal: confirm column names, data types, and array element shape.

Query (SQL if supported):

```sql
select
  "Nightly Price",
  "Host Compensation"
from pricing_list
limit 1;
```

Confirm whether array elements are numbers, JSON objects, or mixed types.

### 1.3 listing.pricing_list FK usage

Target: `public.listing`

Expected: `pricing_list` is a text FK containing Bubble IDs.

Goal: verify name and type; confirm at least one listing has a pricing_list value.

Query (SQL if supported):

```sql
select
  _id,
  pricing_list
from listing
where pricing_list is not null
limit 5;
```

### 1.4 (Optional) Validate pricing_list array bounds

Goal: confirm array length and indexing (likely 7 elements for 1-7 nights).

Query (SQL if supported):

```sql
select
  jsonb_array_length("Nightly Price") as nightly_len,
  jsonb_array_length("Host Compensation") as host_len
from pricing_list
limit 5;
```

## 2) Compare MCP Results to Backend Assumptions

### 2.1 Avg days per month

- Backend uses `Avg days per month` for monthly Other (wks) conversion.
- Confirm value is not null and is a positive number.

### 2.2 pricing_list element type

- Backend expects arrays of numbers.
- If arrays contain objects like `{ num: <value> }`, update parsers accordingly.

### 2.3 listing.pricing_list

- Confirm text type + non-null values for active listings.

## 3) Follow-up Implementation (After MCP Confirmation)

### 3.1 If pricing_list elements are objects

- Update `getPricingListRates()` in:
  - `supabase/functions/proposal/lib/calculations.ts`

### 3.2 If `Avg days per month` column name differs

- Update `fetchAvgDaysPerMonth()` in:
  - `supabase/functions/proposal/lib/calculations.ts`

### 3.3 Frontend alignment (after backend confirmed)

- Implement rental-type labels.
- Implement hc/default strikethrough comparisons using floor/ceil logic.

## 4) MCP Results to Capture

Paste these back into the next session:

- MCP tool name + sample payload
- `Avg days per month` value + column name
- pricing_list array shape (number vs object)
- Confirmed listing.pricing_list type
