-- Run this once in Supabase → SQL Editor → New query → Run.
--
-- BingoList stores its whole "database" (users, cards, sessions,
-- notifications, etc.) as a single JSON document, the same way it
-- already worked with a local JSON file — this table just gives that
-- document a durable, shared home instead of an ephemeral local disk.
-- Application code never touches this table directly except through
-- lib/db.js, which reads the one row, mutates the JS object in memory,
-- and writes the whole thing back.

create table if not exists kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every write, mostly useful for eyeballing
-- "is this actually being written to" in the Supabase table editor.
create or replace function kv_store_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists kv_store_updated_at on kv_store;
create trigger kv_store_updated_at
  before update on kv_store
  for each row
  execute function kv_store_set_updated_at();
