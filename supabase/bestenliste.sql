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

alter table public.bestenliste enable row level security;
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
  -- höchstens 50 Spieler pro Gruppe
  if not exists (select 1 from bestenliste where gruppe = v_gruppe and spieler_id = p_spieler_id)
     and (select count(*) from bestenliste where gruppe = v_gruppe) >= 50 then
    raise exception 'Diese Gruppe ist schon voll (50 Spieler).';
  end if;

  insert into bestenliste as b
    (gruppe, spieler_id, geheimnis, name, herzen_gesamt, hps, season_stufe, erfolge, aktualisiert)
  values
    (v_gruppe, p_spieler_id, p_geheimnis, v_name, p_herzen_gesamt, p_hps, p_season_stufe, p_erfolge, now())
  on conflict (gruppe, spieler_id) do update
    set name          = excluded.name,
        herzen_gesamt = excluded.herzen_gesamt,
        hps           = excluded.hps,
        season_stufe  = excluded.season_stufe,
        erfolge       = excluded.erfolge,
        aktualisiert  = now()
    where b.geheimnis = excluded.geheimnis;   -- nur der Besitzer darf ändern
end;
$$;


-- ----- Bestenliste einer Gruppe holen (Top 50) -----
create or replace function public.hole_bestenliste(p_gruppe text)
returns table (
  spieler_id    uuid,
  name          text,
  herzen_gesamt double precision,
  hps           double precision,
  season_stufe  integer,
  erfolge       integer,
  aktualisiert  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select spieler_id, name, herzen_gesamt, hps, season_stufe, erfolge, aktualisiert
  from bestenliste
  where gruppe = lower(trim(p_gruppe))
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


-- ----- Rechte: Besucher dürfen nur diese drei Funktionen aufrufen -----
revoke all on function public.melde_punkte(text, uuid, text, text, double precision, double precision, integer, integer) from public;
revoke all on function public.hole_bestenliste(text) from public;
revoke all on function public.verlasse_bestenliste(text, uuid, text) from public;

grant execute on function public.melde_punkte(text, uuid, text, text, double precision, double precision, integer, integer) to anon, authenticated;
grant execute on function public.hole_bestenliste(text) to anon, authenticated;
grant execute on function public.verlasse_bestenliste(text, uuid, text) to anon, authenticated;
