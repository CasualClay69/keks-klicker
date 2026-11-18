-- =====================================================
--  Marie Clicker – Admin-Menü, Belohnungs-Codes, Nachricht an alle, Umfragen
--
--  Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
--  Kann gefahrlos mehrmals ausgeführt werden. Braucht vorher supabase/bestenliste.sql.
--
--  DIE ADMIN-PIN STEHT NICHT IN DIESER DATEI (die liegt öffentlich auf GitHub)!
--  Danach im SQL Editor einmal separat ausführen (eigene PIN einsetzen):
--      select public.admin_pin_setzen('123456');
--  Gespeichert wird nur ein verschlüsselter Fingerabdruck (bcrypt).
--
--  Sicherheit:
--  • Alle Tabellen sind für Besucher gesperrt (RLS an, keine Rechte) – Zugriff nur über die Funktionen.
--  • Admin-Funktionen prüfen bei JEDEM Aufruf die PIN in der Datenbank.
--    Nach 5 falschen Versuchen ist der Admin-Zugang 30 Minuten gesperrt.
--  • admin_pin_setzen darf nur der Datenbank-Besitzer (SQL Editor) aufrufen.
-- =====================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.bl_admin (
  id            integer primary key default 1 check (id = 1),
  pin_hash      text,
  fehlversuche  integer not null default 0,
  gesperrt_bis  timestamptz
);

create table if not exists public.bl_codes (
  code            text primary key,                 -- 8 Zeichen, ohne Bindestrich gespeichert
  art             text not null,                    -- herzen (Stunden Produktion) | sticker (Anzahl) | season (Punkte)
  menge           double precision not null,
  text            text not null default '',         -- z.B. "Für dein tolles Zeugnis!"
  erstellt        timestamptz not null default now(),
  eingeloest_am   timestamptz,
  eingeloest_von  text
);

create table if not exists public.bl_nachrichten (
  id        bigint generated always as identity primary key,
  text      text not null,
  erstellt  timestamptz not null default now(),
  bis       timestamptz not null
);

create table if not exists public.bl_umfragen (
  id        bigint generated always as identity primary key,
  frage     text not null,
  antworten text[] not null,
  erstellt  timestamptz not null default now(),
  offen     boolean not null default true
);

create table if not exists public.bl_stimmen (
  umfrage_id bigint not null references public.bl_umfragen(id) on delete cascade,
  waehler    uuid not null,
  antwort    integer not null,
  primary key (umfrage_id, waehler)
);

alter table public.bl_admin       enable row level security;
alter table public.bl_codes       enable row level security;
alter table public.bl_nachrichten enable row level security;
alter table public.bl_umfragen    enable row level security;
alter table public.bl_stimmen     enable row level security;
revoke all on public.bl_admin, public.bl_codes, public.bl_nachrichten, public.bl_umfragen, public.bl_stimmen
  from anon, authenticated;


-- =====================================================
--  ADMIN-PIN
-- =====================================================

-- PIN setzen – NUR im SQL Editor (Besitzer), für Besucher gesperrt
create or replace function public.admin_pin_setzen(p_pin text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into bl_admin (id, pin_hash, fehlversuche, gesperrt_bis)
  values (1, extensions.crypt(p_pin, extensions.gen_salt('bf')), 0, null)
  on conflict (id) do update set pin_hash = excluded.pin_hash, fehlversuche = 0, gesperrt_bis = null;
$$;
revoke all on function public.admin_pin_setzen(text) from public, anon, authenticated;

-- Prüft die PIN. Rückgabe: null = richtig, sonst eine Fehlermeldung.
-- (Kein "raise exception", sonst würde auch das Hochzählen der Fehlversuche rückgängig gemacht.)
create or replace function public.admin_fehler(p_pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  a bl_admin;
begin
  select * into a from bl_admin where id = 1 for update;
  if not found or a.pin_hash is null then
    return 'Der Admin-Zugang ist noch nicht eingerichtet.';
  end if;
  if a.gesperrt_bis is not null and a.gesperrt_bis > now() then
    return 'Zu viele falsche Versuche – bitte in 30 Minuten nochmal.';
  end if;
  if p_pin is null or extensions.crypt(p_pin, a.pin_hash) <> a.pin_hash then
    update bl_admin
      set fehlversuche = fehlversuche + 1,
          gesperrt_bis = case when fehlversuche + 1 >= 5 then now() + interval '30 minutes' else null end
      where id = 1;
    return 'Falsche PIN.';
  end if;
  update bl_admin set fehlversuche = 0, gesperrt_bis = null where id = 1;
  return null;
end;
$$;
revoke all on function public.admin_fehler(text) from public, anon, authenticated;

-- Anmelden (nur prüfen)
create or replace function public.admin_anmelden(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  return json_build_object('ok', true);
end;
$$;


-- =====================================================
--  BELOHNUNGS-CODES
-- =====================================================

create or replace function public.admin_code_erstellen(p_pin text, p_art text, p_menge double precision, p_text text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  f text := admin_fehler(p_pin);
  zeichen text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   -- ohne 0/O und 1/I
  v_code text;
begin
  if f is not null then return json_build_object('fehler', f); end if;
  if p_art not in ('herzen', 'sticker', 'season') or not (p_menge > 0 and p_menge <= 100000) then
    return json_build_object('fehler', 'Ungültige Belohnung.');
  end if;
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(zeichen, 1 + floor(random() * length(zeichen))::int, 1);
    end loop;
    exit when not exists (select 1 from bl_codes where code = v_code);
  end loop;
  insert into bl_codes (code, art, menge, text) values (v_code, p_art, p_menge, left(coalesce(trim(p_text), ''), 80));
  return json_build_object('code', v_code);
end;
$$;

create or replace function public.admin_codes(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  return json_build_object('codes', coalesce((
    select json_agg(c order by c.erstellt desc)
    from (select code, art, menge, text, erstellt, eingeloest_am, eingeloest_von
          from bl_codes order by erstellt desc limit 20) c), '[]'::json));
end;
$$;

-- Code einlösen (für alle). Jeder Code geht nur einmal.
create or replace function public.loese_code(p_code text, p_wer text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  c bl_codes;
begin
  select * into c from bl_codes where code = v_code for update;
  if not found then raise exception 'Diesen Code gibt es nicht. Bitte genau abschreiben.'; end if;
  if c.eingeloest_am is not null then raise exception 'Dieser Code wurde schon eingelöst.'; end if;
  update bl_codes set eingeloest_am = now(), eingeloest_von = left(coalesce(p_wer, ''), 32) where code = v_code;
  return json_build_object('art', c.art, 'menge', c.menge, 'text', c.text);
end;
$$;


-- =====================================================
--  NACHRICHT AN ALLE
-- =====================================================

-- p_text leer = aktuelle Nachricht beenden
create or replace function public.admin_nachricht(p_pin text, p_text text, p_tage integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  update bl_nachrichten set bis = now() where bis > now();
  if length(trim(coalesce(p_text, ''))) > 0 then
    insert into bl_nachrichten (text, bis)
    values (left(trim(p_text), 300), now() + make_interval(days => greatest(1, least(coalesce(p_tage, 3), 30))));
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.hole_nachricht()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object('id', id, 'text', text, 'bis', bis)
  from bl_nachrichten where bis > now() order by erstellt desc limit 1;
$$;


-- =====================================================
--  UMFRAGEN
-- =====================================================

create or replace function public.admin_umfrage_starten(p_pin text, p_frage text, p_antworten text[])
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  f text := admin_fehler(p_pin);
  v_antworten text[];
begin
  if f is not null then return json_build_object('fehler', f); end if;
  select array_agg(left(trim(a), 40)) into v_antworten
  from unnest(p_antworten) a where length(trim(a)) > 0;
  if length(trim(coalesce(p_frage, ''))) < 3 or coalesce(array_length(v_antworten, 1), 0) < 2
     or array_length(v_antworten, 1) > 6 then
    return json_build_object('fehler', 'Bitte eine Frage und 2 bis 6 Antworten eingeben.');
  end if;
  update bl_umfragen set offen = false where offen;
  insert into bl_umfragen (frage, antworten) values (left(trim(p_frage), 120), v_antworten);
  return json_build_object('ok', true);
end;
$$;

create or replace function public.admin_umfrage_beenden(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  update bl_umfragen set offen = false where offen;
  return json_build_object('ok', true);
end;
$$;

-- Die neueste Umfrage (offen oder höchstens 3 Tage beendet) mit Stimmen pro Antwort
create or replace function public.hole_umfrage(p_waehler uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', u.id, 'frage', u.frage, 'antworten', u.antworten, 'offen', u.offen,
    'stimmen', (select coalesce(array_agg(coalesce((select count(*) from bl_stimmen s
                                                     where s.umfrage_id = u.id and s.antwort = i), 0) order by i), '{}')
                from generate_series(0, array_length(u.antworten, 1) - 1) i),
    'meine', (select antwort from bl_stimmen s where s.umfrage_id = u.id and s.waehler = p_waehler))
  from bl_umfragen u
  where u.offen or u.erstellt > now() - interval '3 days'
  order by u.erstellt desc limit 1;
$$;

create or replace function public.stimme_ab(p_umfrage bigint, p_waehler uuid, p_antwort integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare u bl_umfragen;
begin
  select * into u from bl_umfragen where id = p_umfrage;
  if not found or not u.offen then raise exception 'Diese Umfrage ist schon vorbei.'; end if;
  if p_antwort < 0 or p_antwort >= array_length(u.antworten, 1) then raise exception 'Ungültige Antwort.'; end if;
  insert into bl_stimmen (umfrage_id, waehler, antwort) values (p_umfrage, p_waehler, p_antwort)
  on conflict (umfrage_id, waehler) do update set antwort = excluded.antwort;
end;
$$;


-- =====================================================
--  BESTENLISTE MODERIEREN
-- =====================================================

create or replace function public.admin_eintrag_loeschen(p_pin text, p_spieler_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  delete from bestenliste where spieler_id = p_spieler_id;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.admin_eintrag_umbenennen(p_pin text, p_spieler_id uuid, p_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  f text := admin_fehler(p_pin);
  v_name text := trim(coalesce(p_name, ''));
begin
  if f is not null then return json_build_object('fehler', f); end if;
  if length(v_name) < 1 or length(v_name) > 16 then
    return json_build_object('fehler', 'Der Spitzname muss 1 bis 16 Zeichen lang sein.');
  end if;
  if exists (select 1 from bestenliste where lower(name) = lower(v_name) and spieler_id <> p_spieler_id) then
    return json_build_object('fehler', 'Diesen Spitznamen gibt es schon.');
  end if;
  update bestenliste set name = v_name where spieler_id = p_spieler_id;
  return json_build_object('ok', true);
end;
$$;


-- =====================================================
--  RECHTE: Besucher dürfen nur diese Funktionen aufrufen
-- =====================================================
revoke all on function public.admin_anmelden(text) from public;
revoke all on function public.admin_code_erstellen(text, text, double precision, text) from public;
revoke all on function public.admin_codes(text) from public;
revoke all on function public.loese_code(text, text) from public;
revoke all on function public.admin_nachricht(text, text, integer) from public;
revoke all on function public.hole_nachricht() from public;
revoke all on function public.admin_umfrage_starten(text, text, text[]) from public;
revoke all on function public.admin_umfrage_beenden(text) from public;
revoke all on function public.hole_umfrage(uuid) from public;
revoke all on function public.stimme_ab(bigint, uuid, integer) from public;
revoke all on function public.admin_eintrag_loeschen(text, uuid) from public;
revoke all on function public.admin_eintrag_umbenennen(text, uuid, text) from public;

grant execute on function public.admin_anmelden(text) to anon, authenticated;
grant execute on function public.admin_code_erstellen(text, text, double precision, text) to anon, authenticated;
grant execute on function public.admin_codes(text) to anon, authenticated;
grant execute on function public.loese_code(text, text) to anon, authenticated;
grant execute on function public.admin_nachricht(text, text, integer) to anon, authenticated;
grant execute on function public.hole_nachricht() to anon, authenticated;
grant execute on function public.admin_umfrage_starten(text, text, text[]) to anon, authenticated;
grant execute on function public.admin_umfrage_beenden(text) to anon, authenticated;
grant execute on function public.hole_umfrage(uuid) to anon, authenticated;
grant execute on function public.stimme_ab(bigint, uuid, integer) to anon, authenticated;
grant execute on function public.admin_eintrag_loeschen(text, uuid) to anon, authenticated;
grant execute on function public.admin_eintrag_umbenennen(text, uuid, text) to anon, authenticated;
