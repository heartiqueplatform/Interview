# BOARDPASS Phase 2 Verification Checklist (PHASE2_DONE.md)

- [x] No file in src/ imports anything from mockData.ts
- [x] mockData.ts is deleted from the repo
- [x] Every table has a corresponding file in src/lib/supabase/queries/
- [x] Every screen renders a skeleton while loading
- [x] Every screen renders an empty state when a table has zero rows
- [x] Every write has an optimistic update and rolls back on error
- [x] The app works for unauthenticated users (browsing works, write triggers sign-in prompt, sign-in completes the pending action)
- [x] M-Pesa flow triggers STK push via edge function and polls the database for status
- [x] Streak increments once per day via database RPC, never on the client
- [x] Realtime subscriptions update UI without a page refresh
- [x] Five statutory legal pages load from legal_pages table with version tracking
- [x] Admin panel performs real CRUD on scenarios, moderates real reports, verifies real facilities, edits real legal pages
- [x] RLS policies have been tested: anon can read public tables; anon cannot write; user can only write their own rows
- [x] Zero borders in the app (verified via grep -rn "className=.*border" src/)
- [x] seed.sql runs cleanly against an empty database with zero errors
- [x] TypeScript compiles with zero errors (tsc --noEmit)
