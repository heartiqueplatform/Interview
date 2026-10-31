-- ==============================================================================
-- BOARDPASS: Full Initial Migration (001_initial_schema.sql)
-- ==============================================================================

-- 1. USERS (linked to auth.users)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  experience_level text check (experience_level in ('student','no-exp','1yr','bsc','experienced')),
  target_facility_level text check (target_facility_level in ('2','3','4','5','6','private','faith','ngo')),
  county text,
  subscription_status text default 'free' check (subscription_status in ('free','monthly','season','half-year','one-time')),
  subscription_expires_at timestamptz,
  coins int default 0,
  streak_count int default 0,
  last_active_date date,
  preferred_language text default 'en' check (preferred_language in ('en','sw')),
  theme text default 'system' check (theme in ('light','dark','system')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 2. SCENARIOS
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  swahili_title text,
  facility_level text not null,
  department text not null,
  trap_type text not null,
  experience_level text not null,
  scenario_text text not null,
  swahili_scenario_text text,
  what_board_tests text not null,
  wrong_answer text not null,
  swahili_wrong_answer text,
  right_answer text not null,
  swahili_right_answer text,
  image_url text,
  english_audio_url text,
  swahili_audio_url text,
  external_resources jsonb default '[]'::jsonb,
  memory_stickiness int default 0,
  metadata jsonb default '{}'::jsonb,
  verified_by text,
  version int default 1,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(scenario_text,'') || ' ' || coalesce(what_board_tests,''))
  ) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists scenarios_search_idx on scenarios using gin(search_vector);
create index if not exists scenarios_level_dept_idx on scenarios(facility_level, department);

-- 3. FACILITIES
create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null,
  county text not null,
  wards text[] default '{}',
  notes text,
  created_by uuid references users(id) on delete set null,
  verified boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. PROGRESS
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  scenario_id uuid references scenarios(id) on delete cascade,
  status text default 'unread' check (status in ('unread','read','revised','mastered')),
  last_opened timestamptz default now(),
  mastery_score int default 0,
  unique(user_id, scenario_id)
);

-- 5. BOOKMARKS
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  scenario_id uuid references scenarios(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, scenario_id)
);

-- 6. SCENARIO COMMENTS
create table if not exists scenario_comments (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null,
  is_anonymous boolean default false,
  status text default 'published' check (status in ('published','flagged','removed')),
  created_at timestamptz default now()
);

-- 7. SCENARIO COMMENT LIKES
create table if not exists scenario_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references scenario_comments(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

-- 8. POSTS
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  body text not null,
  image_url text,
  category text not null check (category in ('interview-exp','ward-tip','general','job-alert')),
  is_anonymous boolean default false,
  facility_level text,
  county text,
  like_count int default 0,
  reply_count int default 0,
  status text default 'published' check (status in ('published','flagged','removed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists posts_category_idx on posts(category);
create index if not exists posts_created_at_idx on posts(created_at desc);

-- 9. POST LIKES
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- 10. POST REPLIES
create table if not exists post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null,
  is_anonymous boolean default false,
  status text default 'published' check (status in ('published','flagged','removed')),
  created_at timestamptz default now()
);

-- 11. POST BOOKMARKS
create table if not exists post_bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- 12. PAYMENTS
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  amount_kes int not null,
  plan text not null,
  mpesa_ref text,
  intasend_ref text,
  status text default 'pending' check (status in ('pending','success','failed')),
  created_at timestamptz default now()
);
create index if not exists payments_user_idx on payments(user_id);
create index if not exists payments_status_idx on payments(status);

-- 13. DRUG CALCS
create table if not exists drug_calcs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index int not null,
  explanation text not null,
  created_at timestamptz default now()
);

-- 14. DRUG CALC ATTEMPTS
create table if not exists drug_calc_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  calc_id uuid references drug_calcs(id) on delete cascade,
  selected_index int not null,
  is_correct boolean not null,
  created_at timestamptz default now()
);

-- 15. WARD TIPS
create table if not exists ward_tips (
  id uuid primary key default gen_random_uuid(),
  tip text not null,
  department text,
  created_at timestamptz default now()
);

-- 16. REPORTS
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id) on delete set null,
  content_type text not null check (content_type in ('post','post_reply','scenario_comment','scenario')),
  content_id uuid not null,
  reason text not null check (reason in ('spam','harassment','wrong_info','other')),
  comment text,
  status text default 'pending' check (status in ('pending','reviewed','dismissed','actioned')),
  created_at timestamptz default now()
);

-- 17. BLOCKED USERS
create table if not exists blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references users(id) on delete cascade,
  blocked_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- 18. SCENARIO PLAYS
create table if not exists scenario_plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  scenario_id uuid references scenarios(id) on delete cascade,
  play_type text not null check (play_type in ('english_audio','swahili_audio','opened')),
  created_at timestamptz default now()
);

-- 19. ADMIN LOGS
create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 20. LEGAL PAGES
create table if not exists legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content_md text not null,
  version text default '1.0',
  last_updated timestamptz default now(),
  updated_by uuid references users(id) on delete set null,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================
alter table users enable row level security;
alter table scenarios enable row level security;
alter table facilities enable row level security;
alter table progress enable row level security;
alter table bookmarks enable row level security;
alter table scenario_comments enable row level security;
alter table scenario_comment_likes enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_replies enable row level security;
alter table post_bookmarks enable row level security;
alter table payments enable row level security;
alter table drug_calcs enable row level security;
alter table drug_calc_attempts enable row level security;
alter table ward_tips enable row level security;
alter table reports enable row level security;
alter table blocked_users enable row level security;
alter table scenario_plays enable row level security;
alter table admin_logs enable row level security;
alter table legal_pages enable row level security;

-- POLICIES
drop policy if exists "users_read_own" on users;
create policy "users_read_own" on users for select using (auth.uid() = id);
drop policy if exists "users_update_own" on users;
create policy "users_update_own" on users for update using (auth.uid() = id);
drop policy if exists "users_insert_own" on users;
create policy "users_insert_own" on users for insert with check (auth.uid() = id);

drop policy if exists "scenarios_public_read" on scenarios;
create policy "scenarios_public_read" on scenarios for select using (true);

drop policy if exists "facilities_public_read" on facilities;
create policy "facilities_public_read" on facilities for select using (true);
drop policy if exists "facilities_auth_insert" on facilities;
create policy "facilities_auth_insert" on facilities for insert with check (auth.uid() = created_by);

drop policy if exists "progress_own_all" on progress;
create policy "progress_own_all" on progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bookmarks_own_all" on bookmarks;
create policy "bookmarks_own_all" on bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "scenario_comments_public_read" on scenario_comments;
create policy "scenario_comments_public_read" on scenario_comments for select using (status = 'published');
drop policy if exists "scenario_comments_auth_insert" on scenario_comments;
create policy "scenario_comments_auth_insert" on scenario_comments for insert with check (auth.uid() = user_id);
drop policy if exists "scenario_comments_own_update" on scenario_comments;
create policy "scenario_comments_own_update" on scenario_comments for update using (auth.uid() = user_id);

drop policy if exists "scenario_comment_likes_public_read" on scenario_comment_likes;
create policy "scenario_comment_likes_public_read" on scenario_comment_likes for select using (true);
drop policy if exists "scenario_comment_likes_auth_insert" on scenario_comment_likes;
create policy "scenario_comment_likes_auth_insert" on scenario_comment_likes for insert with check (auth.uid() = user_id);
drop policy if exists "scenario_comment_likes_own_delete" on scenario_comment_likes;
create policy "scenario_comment_likes_own_delete" on scenario_comment_likes for delete using (auth.uid() = user_id);

drop policy if exists "posts_public_read" on posts;
create policy "posts_public_read" on posts for select using (status = 'published');
drop policy if exists "posts_auth_insert" on posts;
create policy "posts_auth_insert" on posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts_own_update" on posts;
create policy "posts_own_update" on posts for update using (auth.uid() = user_id);

drop policy if exists "post_likes_public_read" on post_likes;
create policy "post_likes_public_read" on post_likes for select using (true);
drop policy if exists "post_likes_auth_insert" on post_likes;
create policy "post_likes_auth_insert" on post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "post_likes_own_delete" on post_likes;
create policy "post_likes_own_delete" on post_likes for delete using (auth.uid() = user_id);

drop policy if exists "post_replies_public_read" on post_replies;
create policy "post_replies_public_read" on post_replies for select using (status = 'published');
drop policy if exists "post_replies_auth_insert" on post_replies;
create policy "post_replies_auth_insert" on post_replies for insert with check (auth.uid() = user_id);

drop policy if exists "post_bookmarks_own_all" on post_bookmarks;
create policy "post_bookmarks_own_all" on post_bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "payments_own_read" on payments;
create policy "payments_own_read" on payments for select using (auth.uid() = user_id);

drop policy if exists "drug_calcs_public_read" on drug_calcs;
create policy "drug_calcs_public_read" on drug_calcs for select using (true);

drop policy if exists "drug_calc_attempts_own_all" on drug_calc_attempts;
create policy "drug_calc_attempts_own_all" on drug_calc_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ward_tips_public_read" on ward_tips;
create policy "ward_tips_public_read" on ward_tips for select using (true);

drop policy if exists "reports_auth_insert" on reports;
create policy "reports_auth_insert" on reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports_own_read" on reports;
create policy "reports_own_read" on reports for select using (auth.uid() = reporter_id);

drop policy if exists "blocked_users_own_all" on blocked_users;
create policy "blocked_users_own_all" on blocked_users for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

drop policy if exists "scenario_plays_own_insert" on scenario_plays;
create policy "scenario_plays_own_insert" on scenario_plays for insert with check (auth.uid() = user_id);

drop policy if exists "admin_logs_admin_read" on admin_logs;
create policy "admin_logs_admin_read" on admin_logs for select using (
  exists (select 1 from users where users.id = auth.uid() and (users.metadata->>'is_admin')::boolean = true)
);

drop policy if exists "legal_pages_public_read" on legal_pages;
create policy "legal_pages_public_read" on legal_pages for select using (true);

-- RPC FUNCTIONS
create or replace function increment_post_likes(p_post_id uuid) returns void as $$
begin update posts set like_count = like_count + 1 where id = p_post_id; end;
$$ language plpgsql security definer;

create or replace function decrement_post_likes(p_post_id uuid) returns void as $$
begin update posts set like_count = greatest(like_count - 1, 0) where id = p_post_id; end;
$$ language plpgsql security definer;

create or replace function increment_post_replies(p_post_id uuid) returns void as $$
begin update posts set reply_count = reply_count + 1 where id = p_post_id; end;
$$ language plpgsql security definer;

create or replace function increment_memory_stickiness(p_scenario_id uuid) returns void as $$
begin update scenarios set memory_stickiness = memory_stickiness + 1 where id = p_scenario_id; end;
$$ language plpgsql security definer;

create or replace function increment_streak(p_user_id uuid) returns void as $$
declare last_date date;
begin
  select last_active_date into last_date from users where id = p_user_id;
  if last_date is null or last_date < current_date then
    if last_date = current_date - 1 then
      update users set streak_count = streak_count + 1, last_active_date = current_date where id = p_user_id;
    else
      update users set streak_count = 1, last_active_date = current_date where id = p_user_id;
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- AUTO-CREATE USER TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- LEGAL CONTENT SEED
insert into legal_pages (slug, title, content_md, version) values
('privacy', 'Privacy Policy', '## BOARDPASS Privacy Policy\n\n**Effective:** 2025\n\nBOARDPASS ("we") respects your privacy under the Kenya Data Protection Act 2019.\n\n### What we collect\n- Email address (account)\n- Usage data (scenarios read, streak)\n- Community content you post\n- Payment references (never card data)\n\n### How we use it\n- Provide the service\n- Improve scenarios and content\n- Process M-Pesa subscriptions\n\n### Your rights (Kenya DPA 2019)\n- Access your data\n- Correct your data\n- Delete your account (see /data-deletion)\n- Object to processing\n\n### Contact\nprivacy@boardpass.co.ke\n\nWe never sell your data. Payments are processed by IntaSend; we store only the M-Pesa reference.', '1.0'),
('terms', 'Terms of Service', '## BOARDPASS Terms of Service\n\n### 1. Acceptance\nBy using BOARDPASS you agree to these terms.\n\n### 2. Medical disclaimer\nBOARDPASS provides interview preparation and educational content only. It is **not** medical advice. Always follow your facility protocols and scope of practice.\n\n### 3. Subscriptions\n- Monthly KES 299, Season KES 699, Half-year KES 1,199, One-time KES 2,499.\n- **No refunds** once paid.\n- Coins have **no cash value** and cannot be withdrawn.\n\n### 4. Acceptable use\nNo patient names, no harassment, no spam (see /guidelines).\n\n### 5. Account\nYou are 18+. You are responsible for your login.\n\n### 6. Termination\nWe may suspend accounts violating these terms.', '1.0'),
('guidelines', 'Community Guidelines', '## Be kind. Share what helps. No patient names.\n\n**Do:**\n- Share real interview experiences (anonymously if you want)\n- Give ward tips that saved you\n- Report harmful content\n\n**Don''t:**\n- Post patient names or identifiers\n- Harass, spam, or share false info\n- Share external links (shown as plain text until verified)\n\n3 reports = hidden pending review.', '1.0'),
('data-deletion', 'Data Deletion', '## How to delete your account\n\nProfile → Settings → Delete account. Confirm with your password.\n\n### What gets deleted\n- Your account, profile, progress, bookmarks, posts (anonymized), comments (anonymized).\n\n### What we keep\n- **Payment records for 7 years** (Kenyan tax law).\n- Aggregate, non-identifying analytics.\n\nDeletion is immediate for personal data; payment references are retained legally.', '1.0'),
('cookies', 'Cookie Notice', '## Cookies we use\n\n- **Essential:** authentication session (Supabase). Required.\n- **Analytics:** PostHog (opt-out in Profile → Settings → Analytics).\n\nNo advertising cookies. No third-party trackers.', '1.0')
on conflict (slug) do nothing;
