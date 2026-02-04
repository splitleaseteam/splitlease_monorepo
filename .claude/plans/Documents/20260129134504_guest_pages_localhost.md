# Guest-Only Pages - Development (localhost:8001)

**Environment:** Development
**Base URL:** `http://localhost:8001`
**Total Pages:** 8 (all protected)

---

## URLs

```
http://localhost:8001/guest-proposals
http://localhost:8001/guest-leases
http://localhost:8001/favorite-listings
http://localhost:8001/favorite-listings-v2
http://localhost:8001/rental-application
http://localhost:8001/guest-experience-review
http://localhost:8001/simulation-guest-mobile
http://localhost:8001/simulation-guestside-demo
```

---

## Page Details

| URL | Purpose |
|-----|---------|
| http://localhost:8001/guest-proposals | View sent proposals and status |
| http://localhost:8001/guest-leases | Manage active/upcoming stays |
| http://localhost:8001/favorite-listings | Saved/favorited listings |
| http://localhost:8001/favorite-listings-v2 | Saved listings v2 (devOnly) |
| http://localhost:8001/rental-application | Submit rental application |
| http://localhost:8001/guest-experience-review | Guest feedback survey |
| http://localhost:8001/simulation-guest-mobile | Guest mobile simulation (day 2) |
| http://localhost:8001/simulation-guestside-demo | Guest usability testing |

---

**Note:** All pages require authentication. Unauthenticated users will be redirected to homepage with auth modal.

**Dev Server:** Start with `bun run dev` from `app/` directory.
