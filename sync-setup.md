# Setting up sync across devices

Zara's Movies can keep your profiles, watchlists, Continue Watching, settings and
search history the same on every device. It uses **Supabase** (free) to store one
private copy of your data per account. You sign in with your email — no password.

This takes about 10 minutes, once.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> and sign up (free).
2. Click **New project**. Give it any name (e.g. `zaras-movies`), set a database
   password (you won't need it again — save it somewhere), pick the region closest
   to you, and click **Create new project**. Wait a minute for it to finish.

## 2. Create the table (copy–paste)

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Paste all of this and click **Run**:

```sql
-- One private row of app data per account
create table public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Nobody can read or change anyone else's row
alter table public.user_data enable row level security;

create policy "Read own data" on public.user_data
  for select using (auth.uid() = user_id);

create policy "Create own data" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "Update own data" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

You should see "Success. No rows returned".

## 3. Tell Supabase where your app lives

1. Open **Authentication** → **URL Configuration**.
2. **Site URL**: your app's address on Netlify or Vercel, e.g.
   `https://zaras-movies.netlify.app`
3. **Redirect URLs** → **Add URL** for each of these:
   - your app's address again, e.g. `https://zaras-movies.netlify.app/**`
   - `http://localhost:8765/**` (only if you also run it on this Mac)
4. Click **Save**.

## 4. Add the sign-in code to the email (recommended)

The email contains a link. If you've installed the app on your phone or computer,
links open in the browser rather than the app — so it's easier to type a code.

1. Open **Authentication** → **Emails** (may be called **Email Templates**) → **Magic Link**.
2. Replace the message body with:

```html
<h2>Sign in to Zara's Movies</h2>
<p><a href="{{ .ConfirmationURL }}">Sign in on this device</a></p>
<p>Or type this code in the app: <strong>{{ .Token }}</strong></p>
```

3. Click **Save**.

## 5. Paste your project's details into the app

1. Open **Project Settings** (gear icon) → **API** (or **Data API**).
2. Copy the **Project URL** and the **anon public** key.
3. Open `app.js` and fill in the two lines near the top:

```js
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

The anon key is designed to be public — the rules from step 2 are what keep each
account's data private. **Never** paste the `service_role` key into the app.

4. Deploy the updated files to Netlify / Vercel as you normally do.

## 6. Sign in

- **On the device you already use:** Settings → **Account & sync** → **Sign in**.
  Everything already on this device is uploaded to your account.
- **On a new device:** on the "Who's watching?" screen, tap
  **Already use Zara's Movies on another device? Sign in**. Your profiles appear —
  pick yours and carry on where you left off.

---

### How it behaves

- Changes upload a few seconds after you make them (at most every 30 seconds while
  a video is saving progress), and download whenever you come back to the app.
- If two devices change the same thing, the most recent change wins.
- Which profile is active is per device, so the TV can be on one profile and your
  phone on another.
- Signing out keeps this device's copy; it just stops syncing.
- Free Supabase projects pause after a week without any use. If sync stops
  working after a break, open your Supabase dashboard and click **Restore**.

### Troubleshooting

| Problem | Fix |
|---|---|
| Settings says "Sync isn't set up yet" | Step 5 — the two values in `app.js` are empty, or the new `app.js` isn't deployed yet. |
| The email link opens a page with an error | Step 3 — add your app's address to **Redirect URLs**. |
| The email has no code | Step 4. |
| "Sync failed" | Check you ran the SQL in step 2. A network filter (like the SafeDNS filter on your current Wi-Fi, which also blocks TMDB) can block `supabase.co` too. |
