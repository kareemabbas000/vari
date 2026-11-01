-- PROPOSED, NOT APPLIED. Knowledge ecosystem schema (docs/KNOWLEDGE-ECOSYSTEM.md §9).
-- Review, then run in Supabase → SQL Editor, or copy it to
-- supabase/migrations/<timestamp>_answers.sql and run `supabase db push`.
-- After applying: regenerate lib/database.types.ts.
--
-- Same conventions as the blog: one language-independent row + one translation row per
-- language (locale → languages), RLS via has_role(), audit + updated_at triggers, column
-- grants that keep editorial fields away from visitors. No hard-coded language list.

-- ---------------------------------------------------------------------------
-- Topics (hubs)
-- ---------------------------------------------------------------------------
create table public.answer_topics (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  domain       text not null check (domain in ('visualization', 'interior', 'architecture', 'real-estate', 'tools', 'regional')),
  name         jsonb not null default '{}'::jsonb,          -- {"en": "Rendering costs", …}
  description  jsonb not null default '{}'::jsonb,
  sort         int not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Answers (one per question cluster)
-- ---------------------------------------------------------------------------
create table public.answers (
  id           uuid primary key default gen_random_uuid(),
  cluster_id   text not null unique check (cluster_id ~ '^[A-Z][0-9]+\.[0-9]+$'),   -- QUESTION-MAP.md id, e.g. V1.1
  topic_id     uuid references public.answer_topics (id) on delete set null,
  page_type    text not null default 'answer' check (page_type in ('answer', 'comparison', 'cost-guide', 'how-to')),
  intent       text not null check (intent in ('learn', 'cost', 'compare', 'choose', 'how-to', 'trust', 'local')),
  audience     text[] not null default '{}' check (audience <@ array['homeowner', 'developer', 'architect', 'marketer', 'business', 'student']),
  stage        text not null default 'aware' check (stage in ('aware', 'considering', 'deciding', 'hiring')),
  priority     smallint not null default 2 check (priority between 1 and 3),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  publish_at   timestamptz,
  reviewer_id  uuid references public.blog_authors (id) on delete set null,       -- named expert
  reviewed_at  timestamptz,
  faq          jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),       -- [{q:{en..}, a:{en..}}]
  sources      jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),   -- [{label, url, checked}]
  notes        text check (char_length(notes) <= 4000),                                      -- editorial, never public
  sort         int not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles (id) on delete set null
);
create index answers_public_idx on public.answers (status, publish_at desc);
create index answers_topic_idx on public.answers (topic_id);

create table public.answer_translations (
  answer_id        uuid not null references public.answers (id) on delete cascade,
  locale           text not null references public.languages (code) on update cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  question         text not null default '' check (char_length(question) <= 200),      -- H1
  short_answer     text not null default '' check (char_length(short_answer) <= 900),  -- 40–80 words
  takeaways        jsonb not null default '[]'::jsonb check (jsonb_typeof(takeaways) = 'array'),
  content          jsonb,                                                             -- editor working copy
  html             text not null default '',
  variants         text[] not null default '{}',                                       -- "People also ask it as"
  seo_title        text not null default '' check (char_length(seo_title) <= 120),
  seo_description  text not null default '' check (char_length(seo_description) <= 320),
  ready            boolean not null default false,
  source_hash      text,                                                              -- English fingerprint → "outdated"
  word_count       int not null default 0,
  updated_at       timestamptz not null default now(),
  primary key (answer_id, locale),
  unique (locale, slug)
);

-- Internal links: services, projects, related answers, blog posts, glossary terms.
create table public.answer_links (
  answer_id  uuid not null references public.answers (id) on delete cascade,
  kind       text not null check (kind in ('answer', 'service', 'project', 'blog_post', 'glossary')),
  target     text not null check (char_length(target) <= 120),   -- answer cluster_id, service key, project slug, post id, term slug
  sort       int not null default 100,
  primary key (answer_id, kind, target)
);

-- ---------------------------------------------------------------------------
-- Glossary (DefinedTerm pages; English slug in every language, like other pages)
-- ---------------------------------------------------------------------------
create table public.glossary_terms (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  term        jsonb not null default '{}'::jsonb,     -- {"en": "Global illumination", "de": …}
  definition  jsonb not null default '{}'::jsonb,     -- one or two sentences per language
  body        jsonb not null default '{}'::jsonb,     -- optional longer HTML per language
  aliases     text[] not null default '{}',
  published   boolean not null default false,
  sort        int not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Question signals (intake / backlog; panel only, never public)
-- ---------------------------------------------------------------------------
create table public.question_signals (
  id           bigint generated always as identity primary key,
  text         text not null check (char_length(text) between 3 and 400),
  locale       text references public.languages (code) on update cascade,
  source       text not null check (source in ('gsc', 'bing', 'paa', 'forum', 'ai', 'enquiry', 'competitor', 'other')),
  url          text check (char_length(url) <= 500),
  volume       int check (volume >= 0),
  observed_at  date not null default current_date,
  status       text not null default 'new' check (status in ('new', 'mapped', 'rejected')),
  answer_id    uuid references public.answers (id) on delete set null,
  created_at   timestamptz not null default now(),
  created_by   uuid references public.profiles (id) on delete set null
);
create index question_signals_status_idx on public.question_signals (status, observed_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger answer_topics_updated before update on public.answer_topics for each row execute function public.set_updated_at();
create trigger answers_updated before update on public.answers for each row execute function public.set_updated_at();
create trigger answer_translations_updated before update on public.answer_translations for each row execute function public.set_updated_at();
create trigger glossary_terms_updated before update on public.glossary_terms for each row execute function public.set_updated_at();

create trigger answer_topics_audit after insert or update or delete on public.answer_topics for each row execute function public.audit_row();
create trigger answers_audit after insert or update or delete on public.answers for each row execute function public.audit_row();
create trigger glossary_terms_audit after insert or update or delete on public.glossary_terms for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.answer_topics enable row level security;
alter table public.answers enable row level security;
alter table public.answer_translations enable row level security;
alter table public.answer_links enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.question_signals enable row level security;

create or replace function public.answer_is_live(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.answers a where a.id = p_id and a.status = 'published' and a.publish_at is not null and a.publish_at <= now());
$$;
revoke all on function public.answer_is_live(uuid) from public;
grant execute on function public.answer_is_live(uuid) to anon, authenticated;

-- Public reads
create policy "public read answer topics" on public.answer_topics for select to anon, authenticated using (true);
create policy "public read live answers" on public.answers for select to anon, authenticated
  using ((status = 'published' and publish_at is not null and publish_at <= now()) or (select public.has_role('viewer')));
create policy "public read ready answer translations" on public.answer_translations for select to anon, authenticated
  using ((ready and public.answer_is_live(answer_id)) or (select public.has_role('viewer')));
create policy "public read answer links" on public.answer_links for select to anon, authenticated
  using (public.answer_is_live(answer_id) or (select public.has_role('viewer')));
create policy "public read published glossary" on public.glossary_terms for select to anon, authenticated
  using (published or (select public.has_role('viewer')));

-- Editors write content
create policy "editors write answer topics" on public.answer_topics for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write answers" on public.answers for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write answer translations" on public.answer_translations for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write answer links" on public.answer_links for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write glossary" on public.glossary_terms for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));

-- Signals: team reads, editors log and map, admins delete
revoke all on public.question_signals from anon;
create policy "team reads signals" on public.question_signals for select to authenticated using ((select public.has_role('viewer')));
create policy "editors add signals" on public.question_signals for insert to authenticated with check ((select public.has_role('editor')));
create policy "editors map signals" on public.question_signals for update to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "admins delete signals" on public.question_signals for delete to authenticated using ((select public.has_role('admin')));

-- Visitors never receive editorial fields or working copies.
revoke select on public.answers from anon;
grant select (id, cluster_id, topic_id, page_type, intent, audience, stage, status, publish_at, reviewer_id, reviewed_at, faq, sources, sort, created_at, updated_at)
  on public.answers to anon;
revoke select on public.answer_translations from anon;
grant select (answer_id, locale, slug, question, short_answer, takeaways, html, variants, seo_title, seo_description, ready, word_count, updated_at)
  on public.answer_translations to anon;

-- ---------------------------------------------------------------------------
-- Seed: the 18 topics of QUESTION-MAP.md (names in English; translate in the panel)
-- ---------------------------------------------------------------------------
insert into public.answer_topics (slug, domain, name, sort) values
  ('rendering-costs',            'visualization', '{"en":"Rendering costs & pricing"}', 10),
  ('rendering-process',          'visualization', '{"en":"Rendering process & deliverables"}', 20),
  ('choosing-a-rendering-studio','visualization', '{"en":"Choosing a rendering studio"}', 30),
  ('visualization-formats',      'visualization', '{"en":"Visualization formats & uses"}', 40),
  ('off-plan-marketing',         'real-estate',   '{"en":"Off-plan & real-estate marketing"}', 50),
  ('hiring-an-interior-designer','interior',      '{"en":"Hiring an interior designer"}', 60),
  ('interior-design-decisions',  'interior',      '{"en":"Interior design decisions"}', 70),
  ('see-it-before-you-build',    'interior',      '{"en":"See it before you build it"}', 80),
  ('commercial-interiors',       'interior',      '{"en":"Commercial & hospitality interiors"}', 90),
  ('working-with-an-architect',  'architecture',  '{"en":"Working with an architect"}', 100),
  ('architectural-design',       'architecture',  '{"en":"Architectural design"}', 110),
  ('ai-and-rendering-tools',     'tools',         '{"en":"AI & rendering tools"}', 120),
  ('egypt',                      'regional',      '{"en":"Egypt"}', 130),
  ('germany',                    'regional',      '{"en":"Germany"}', 140),
  ('spain',                      'regional',      '{"en":"Spain"}', 150),
  ('gulf',                       'regional',      '{"en":"Gulf (UAE & Saudi Arabia)"}', 160),
  ('turkey',                     'regional',      '{"en":"Turkey"}', 170),
  ('learning-archviz',           'tools',         '{"en":"Learning architectural visualization"}', 180)
on conflict (slug) do nothing;
