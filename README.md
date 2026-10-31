# BOARDPASS 🇰🇪
*Every Kenyan nurse. Every shift. Every interview. Ready.*

BOARDPASS is the mobile-first progressive web application (PWA) designed specifically for Kenyan nurses, providing real hospital board interview scenarios, clinical ward readiness drills, drug calculation exercises, peer community discussions, and Safaricom M-Pesa subscriptions.

---

## 🚀 Setup & Supabase Configuration

### 1. Supabase Dashboard: Disable Email Confirmation
To allow Kenyan nurses to sign up and start preparing immediately:
1. Open your **Supabase Project Dashboard**.
2. Navigate to **Authentication** → **Providers** → **Email**.
3. Toggle **OFF** "Confirm email".
4. Click **Save**.

### 2. Run Database Migration
Execute the full schema in your Supabase SQL Editor:
- File: `supabase/migrations/001_initial_schema.sql`
- This provisions:
  - All 20 relational tables with Row Level Security (RLS)
  - Auto user trigger (`handle_new_user`)
  - RPC functions (`increment_post_likes`, `decrement_post_likes`, `increment_post_replies`, `increment_memory_stickiness`, `increment_streak`)
  - Complete statutory seed content for all 5 Kenyan DPA-compliant legal pages (`privacy`, `terms`, `guidelines`, `data-deletion`, `cookies`)

### 3. Deploy Supabase Edge Functions (IntaSend M-Pesa)
Deploy the two payment edge functions using the Supabase CLI:

```bash
# Set Edge Function Secrets in Supabase Dashboard:
# INTASEND_PUBLISHABLE_KEY
# INTASEND_SECRET_KEY
# INTASEND_ENVIRONMENT (sandbox or production)

supabase functions deploy intasend-stk --no-verify-jwt
supabase functions deploy mpesa-callback --no-verify-jwt
```

---

## 🎨 Design System: Absolute Zero Borders Law
- **Zero borders anywhere in the app**: No borders on cards, buttons, inputs, modals, tabs, or answer blocks. Separation is achieved through solid contrast backgrounds and tints.
- **Wrong answer block**: Background `rgba(248,81,73,0.12)` dark / `rgba(248,81,73,0.08)` light, radius 8px, padding 16px.
- **Right answer block**: Background `rgba(63,185,80,0.12)` dark / `rgba(63,185,80,0.08)` light, radius 8px, padding 16px.
- **Dark mode background**: `#0d1117`, card `#161b22`, text `#e6edf3`.
- **Light mode background**: `#ffffff`, card `#f0f3f6`, text `#1f2328`.
- **Optimistic toggles**: All bookmarks, likes, and mastered statuses update instantaneously on tap with automatic revert-on-failure notifications.

---

## 📱 Offline PWA
- Service worker and cache configuration for offline scenarios and ward tips.
- Real-time offline indicator banner when disconnected (`navigator.onLine === false`).
- IndexedDB background write queue that automatically flushes when connection is restored.
