-- =====================================================
--  Marie Clicker – Bestenliste für Familie & Freunde
--
--  Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
--  Kann gefahrlos mehrmals ausgeführt werden.
--
--  Sicherheit:
--  • Die Tabelle selbst ist für Besucher komplett gesperrt (RLS an, keine Rechte).
--  • Zugriff NUR über die drei Funktionen unten.
--  • Lesen nur mit dem genauen Gruppen-Code – Gruppen lassen sich nicht auflisten.
--  • Jeder Spieler hat ein Geheimnis: Nur wer es kennt, kann seinen Eintrag ändern oder löschen.
--
--  Wochen-Wettbewerb: Wer sammelt von Montag 0 Uhr bis Sonntag 24 Uhr (deutsche Zeit) die
--  meisten Herzen? Das rechnet die Datenbank selbst aus – aus "herzen_gesamt" beim ersten
--  Melden in der Woche (woche_start). Die Gewinner der letzten Woche bekommen
--  in der Liste einen besonderen Rahmen (wochen_sieger = true).
--
--  Sticker-Post (seit v1.62): Doppelte Sticker an andere Spieler aus der Liste schicken.
--  Der Empfänger holt sie beim nächsten Öffnen der App ab.
-- =====================================================

create table if not exists public.bestenliste (
  gruppe         text             not null,
  spieler_id     uuid             not null,
  geheimnis      text             not null,
  name           text             not null,
  herzen_gesamt  double precision not null default 0,
  hps            double precision not null default 0,
  season_stufe   integer          not null default 0,
  erfolge        integer          not null default 0,
  aktualisiert   timestamptz      not null default now(),
  primary key (gruppe, spieler_id)
);

-- Wochen-Wettbewerb (seit v1.44) – bestehende Einträge bleiben erhalten
alter table public.bestenliste add column if not exists woche           text;
alter table public.bestenliste add column if not exists woche_start     double precision not null default 0;
alter table public.bestenliste add column if not exists vorwoche        text;
alter table public.bestenliste add column if not exists vorwoche_herzen double precision not null default 0;

-- Jeder Spitzname nur einmal pro Gruppe (seit v1.46).
-- Vorher entstandene doppelte Einträge aufräumen: behalten wird der zuletzt aktualisierte.
delete from public.bestenliste a
using public.bestenliste b
where a.gruppe = b.gruppe
  and lower(a.name) = lower(b.name)
  and a.spieler_id <> b.spieler_id
  and (a.aktualisiert < b.aktualisiert or (a.aktualisiert = b.aktualisiert and a.spieler_id < b.spieler_id));
create unique index if not exists bestenliste_name_einmalig on public.bestenliste (gruppe, lower(name));

alter table public.bestenliste enable row level security;


-- ----- Welche Woche ist gerade? z.B. "2026-W47" (deutsche Zeit, Woche beginnt Montag) -----
create or replace function public.bl_woche(p_zeit timestamptz)
returns text
language sql
stable
as $$
  select to_char(p_zeit at time zone 'Europe/Berlin', 'IYYY-"W"IW');
$$;
revoke all on function public.bl_woche(timestamptz) from public;
revoke all on public.bestenliste from anon, authenticated;


-- ----- Punkte melden (neu eintragen oder aktualisieren) -----
create or replace function public.melde_punkte(
  p_gruppe        text,
  p_spieler_id    uuid,
  p_geheimnis     text,
  p_name          text,
  p_herzen_gesamt double precision,
  p_hps           double precision,
  p_season_stufe  integer,
  p_erfolge       integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gruppe text := lower(trim(p_gruppe));
  v_name   text := trim(p_name);
  v_woche  text := bl_woche(now());
  v_anderer record;
begin
  if length(v_gruppe) < 4 or length(v_gruppe) > 32 then
    raise exception 'Der Gruppen-Code muss 4 bis 32 Zeichen lang sein.';
  end if;
  if length(v_name) < 1 or length(v_name) > 16 then
    raise exception 'Der Spitzname muss 1 bis 16 Zeichen lang sein.';
  end if;
  if length(p_geheimnis) < 16 or length(p_geheimnis) > 64 then
    raise exception 'Ungültige Anmeldung.';
  end if;
  -- unsinnige Werte ablehnen (NaN ist in Postgres größer als jede Zahl -> fällt hier auch raus)
  if not (p_herzen_gesamt between 0 and 1e18) or not (p_hps between 0 and 1e15)
     or not (p_season_stufe between 0 and 1000) or not (p_erfolge between 0 and 1000) then
    raise exception 'Ungültige Punkte.';
  end if;
  -- Gibt es den Spitznamen schon bei einem ANDEREN Spieler?
  -- • wird gerade gespielt (letzte 15 Minuten) -> ablehnen
  -- • sonst ist es sehr wahrscheinlich dasselbe Kind auf einem Gerät, das seine Anmeldung
  --   verloren hat (Browserdaten gelöscht, anderer Browser …) -> Eintrag übernehmen statt verdoppeln
  select spieler_id, aktualisiert into v_anderer
  from bestenliste
  where gruppe = v_gruppe and lower(name) = lower(v_name) and spieler_id <> p_spieler_id;
  if found then
    if v_anderer.aktualisiert > now() - interval '15 minutes' then
      raise exception 'Den Spitznamen „%“ benutzt gerade jemand anderes. Bitte nimm einen anderen.', v_name;
    end if;
    if exists (select 1 from bestenliste where gruppe = v_gruppe and spieler_id = p_spieler_id) then
      -- man hat schon einen eigenen Eintrag (Umbenennen) -> den alten, verwaisten löschen
      delete from bestenliste where gruppe = v_gruppe and spieler_id = v_anderer.spieler_id;
    else
      -- den verwaisten Eintrag übernehmen (Wochenpunkte bleiben erhalten)
      update bestenliste set spieler_id = p_spieler_id, geheimnis = p_geheimnis
      where gruppe = v_gruppe and spieler_id = v_anderer.spieler_id;
    end if;
    -- noch nicht abgeholte Sticker-Post wandert mit
    update bl_sticker_post set an_id = p_spieler_id
    where gruppe = v_gruppe and an_id = v_anderer.spieler_id and abgeholt is null;
  end if;

  -- höchstens 50 Spieler pro Gruppe
  if not exists (select 1 from bestenliste where gruppe = v_gruppe and spieler_id = p_spieler_id)
     and (select count(*) from bestenliste where gruppe = v_gruppe) >= 50 then
    raise exception 'Diese Gruppe ist schon voll (50 Spieler).';
  end if;

  insert into bestenliste as b
    (gruppe, spieler_id, geheimnis, name, herzen_gesamt, hps, season_stufe, erfolge, aktualisiert, woche, woche_start)
  values
    (v_gruppe, p_spieler_id, p_geheimnis, v_name, p_herzen_gesamt, p_hps, p_season_stufe, p_erfolge, now(), v_woche, p_herzen_gesamt)
  on conflict (gruppe, spieler_id) do update
    set -- Neue Woche? Dann wird die alte Woche als "Vorwoche" gemerkt und neu gezählt.
        -- (Alle Ausdrücke rechts benutzen die Werte VOR dem Update.)
        vorwoche        = case when b.woche is distinct from v_woche then b.woche else b.vorwoche end,
        vorwoche_herzen = case when b.woche is null then 0
                               when b.woche <> v_woche then greatest(0, b.herzen_gesamt - b.woche_start)
                               else b.vorwoche_herzen end,
        woche_start     = case when b.woche is distinct from v_woche then least(b.herzen_gesamt, excluded.herzen_gesamt)
                               else least(b.woche_start, excluded.herzen_gesamt) end,   -- nach "Spielstand löschen" nicht negativ
        woche           = v_woche,
        name          = excluded.name,
        herzen_gesamt = excluded.herzen_gesamt,
        hps           = excluded.hps,
        season_stufe  = excluded.season_stufe,
        erfolge       = excluded.erfolge,
        aktualisiert  = now()
    where b.geheimnis = excluded.geheimnis;   -- nur der Besitzer darf ändern
end;
$$;


-- ----- Bestenliste einer Gruppe holen (Top 50) -----
-- woche_herzen    = in dieser Woche gesammelt
-- vorwoche_herzen = in der letzten Woche gesammelt
-- wochen_sieger   = hat die letzte Woche gewonnen (bei Gleichstand alle mit dem Höchstwert)
drop function if exists public.hole_bestenliste(text);   -- die Rückgabe hat neue Spalten bekommen
create function public.hole_bestenliste(p_gruppe text)
returns table (
  spieler_id      uuid,
  name            text,
  herzen_gesamt   double precision,
  hps             double precision,
  season_stufe    integer,
  erfolge         integer,
  aktualisiert    timestamptz,
  woche_herzen    double precision,
  vorwoche_herzen double precision,
  wochen_sieger   boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with w as (
    select bl_woche(now()) as jetzt, bl_woche(now() - interval '7 days') as letzte
  ),
  d as (
    select b.spieler_id, b.name, b.herzen_gesamt, b.hps, b.season_stufe, b.erfolge, b.aktualisiert,
           case when b.woche = w.jetzt then greatest(0, b.herzen_gesamt - b.woche_start) else 0 end as diese,
           case when b.woche = w.letzte then greatest(0, b.herzen_gesamt - b.woche_start)
                when b.vorwoche = w.letzte then b.vorwoche_herzen
                else 0 end as letzte
    from bestenliste b, w
    where b.gruppe = lower(trim(p_gruppe))
  )
  select spieler_id, name, herzen_gesamt, hps, season_stufe, erfolge, aktualisiert,
         diese, letzte, (letzte > 0 and letzte = max(letzte) over ())
  from d
  order by herzen_gesamt desc
  limit 50;
$$;


-- ----- Gruppe verlassen (eigenen Eintrag löschen) -----
create or replace function public.verlasse_bestenliste(p_gruppe text, p_spieler_id uuid, p_geheimnis text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from bestenliste
  where gruppe = lower(trim(p_gruppe)) and spieler_id = p_spieler_id and geheimnis = p_geheimnis;
$$;


-- =====================================================
--  STICKER-POST: doppelte Sticker an andere Spieler schicken
-- =====================================================

create table if not exists public.bl_sticker_post (
  id        bigint generated always as identity primary key,
  gruppe    text        not null,
  von_id    uuid        not null,
  von_name  text        not null,
  an_id     uuid        not null,
  sticker   text        not null,
  erstellt  timestamptz not null default now(),
  abgeholt  timestamptz
);
create index if not exists bl_sticker_post_an  on public.bl_sticker_post (gruppe, an_id) where abgeholt is null;
create index if not exists bl_sticker_post_von on public.bl_sticker_post (von_id, erstellt);
alter table public.bl_sticker_post enable row level security;
revoke all on public.bl_sticker_post from anon, authenticated;

-- Sticker verschicken. Antwort: {ok, an} oder {fehler}
create or replace function public.sende_sticker(
  p_gruppe text, p_spieler_id uuid, p_geheimnis text, p_an uuid, p_sticker text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gruppe  text := lower(trim(p_gruppe));
  v_name    text;
  v_an_name text;
begin
  select name into v_name from bestenliste
  where gruppe = v_gruppe and spieler_id = p_spieler_id and geheimnis = p_geheimnis;
  if not found then
    return json_build_object('fehler', 'Bitte mach erst bei der Bestenliste mit.');
  end if;
  if p_an = p_spieler_id then
    return json_build_object('fehler', 'An dich selbst kannst du keinen Sticker schicken.');
  end if;
  select name into v_an_name from bestenliste where gruppe = v_gruppe and spieler_id = p_an;
  if not found then
    return json_build_object('fehler', 'Diesen Spieler gibt es nicht mehr in der Bestenliste.');
  end if;
  if p_sticker is null or p_sticker !~ '^[a-z0-9-]{1,40}-[0-9]{1,2}$' then
    return json_build_object('fehler', 'Unbekannter Sticker.');
  end if;
  if (select count(*) from bl_sticker_post
      where von_id = p_spieler_id and erstellt > now() - interval '1 day') >= 30 then
    return json_build_object('fehler', 'Für heute hast du genug Sticker verschickt – morgen geht es weiter!');
  end if;
  if (select count(*) from bl_sticker_post
      where gruppe = v_gruppe and an_id = p_an and abgeholt is null) >= 100 then
    return json_build_object('fehler', 'Der Briefkasten von ' || v_an_name || ' ist gerade voll.');
  end if;

  -- alte, längst abgeholte Post aufräumen
  delete from bl_sticker_post where abgeholt < now() - interval '7 days';

  insert into bl_sticker_post (gruppe, von_id, von_name, an_id, sticker)
  values (v_gruppe, p_spieler_id, v_name, p_an, p_sticker);
  return json_build_object('ok', true, 'an', v_an_name);
end;
$$;

-- Eigene Post abholen (jeder Sticker kommt genau einmal an). Antwort: [{von, sticker}, …]
create or replace function public.hole_sticker_post(p_gruppe text, p_spieler_id uuid, p_geheimnis text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gruppe text := lower(trim(p_gruppe));
  v_post   json;
begin
  if not exists (select 1 from bestenliste
                 where gruppe = v_gruppe and spieler_id = p_spieler_id and geheimnis = p_geheimnis) then
    return '[]'::json;
  end if;
  with geholt as (
    update bl_sticker_post set abgeholt = now()
    where gruppe = v_gruppe and an_id = p_spieler_id and abgeholt is null
    returning von_name, sticker, erstellt
  )
  select coalesce(json_agg(json_build_object('von', von_name, 'sticker', sticker) order by erstellt), '[]'::json)
  into v_post from geholt;
  return v_post;
end;
$$;


-- ----- Rechte: Besucher dürfen nur diese Funktionen aufrufen -----
revoke all on function public.melde_punkte(text, uuid, text, text, double precision, double precision, integer, integer) from public;
revoke all on function public.hole_bestenliste(text) from public;
revoke all on function public.verlasse_bestenliste(text, uuid, text) from public;

grant execute on function public.melde_punkte(text, uuid, text, text, double precision, double precision, integer, integer) to anon, authenticated;
grant execute on function public.hole_bestenliste(text) to anon, authenticated;
grant execute on function public.verlasse_bestenliste(text, uuid, text) to anon, authenticated;

revoke all on function public.sende_sticker(text, uuid, text, uuid, text) from public;
revoke all on function public.hole_sticker_post(text, uuid, text) from public;
grant execute on function public.sende_sticker(text, uuid, text, uuid, text) to anon, authenticated;
grant execute on function public.hole_sticker_post(text, uuid, text) to anon, authenticated;
