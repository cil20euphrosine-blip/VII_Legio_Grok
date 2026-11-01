import {
  DIR_LABEL,
  EMPTY_FIT,
  ERRATA,
  GRID,
  KINGDOM_BY_TYPE,
  PLANET_TYPES,
  RACES,
  RANK_LABEL,
  SHIPS,
  raceById,
  type Dir,
  type Fit,
  type MissionId,
  type Race,
  type RankId,
  type ShipClass,
} from "./content";

export { ERRATA, RANK_LABEL, DIR_LABEL, SHIPS, EMPTY_FIT };
export type { Dir, Fit, MissionId, RankId };

export interface Being {
  uid: number;
  att: number;
  def: number;
  alive: boolean;
}

export interface Planet {
  id: string;
  name: string;
  level: number;
  x: number;
  y: number;
  base: boolean;
  barred: boolean;
  sighted: boolean;
  revealed: number;
  typeId?: string;
  typeName?: string;
  kingdom?: string;
  band?: string;
  raceId?: string;
  temperament?: "pacific" | "hostile" | "merchant";
  radio: "0" | "a" | "b";
  beings: Being[];
  angered: boolean;
  presenceRolled: boolean;
  pending: number;
  hadCrew: boolean;
  suffered: boolean;
  fired: boolean;
  allianceTries: number;
  allianceLocked: boolean;
  tradeTurns: number;
  collected: boolean;
  elimPaid: boolean;
}

export interface Game {
  sector: "interne" | "externe";
  officer: string;
  shipName: string;
  rank: RankId;
  points: number;
  shipId: string;
  fit: Fit;
  men: number;
  ashore: number;
  persona: number;
  turn: number;
  level: number;
  x: number;
  y: number;
  onPlanet: string | null;
  shieldsUp: boolean;
  needArrivals: boolean;
  infoLeft: number;
  seq: number;
  beingSeq: number;
  planets: Planet[];
  bh: { x: number; y: number } | null;
  rmg: { level: number; x: number; y: number }[];
  dn: { level: number; x: number; y: number }[];
  log: { id: number; who: "sc" | "uc"; text: string }[];
  feuille: string[];
  phase:
    | { t: "officer" }
    | { t: "ship" }
    | { t: "fit" }
    | { t: "persona" }
    | { t: "play" }
    | { t: "route"; segs: { dir: Dir; n: number }[]; landing: boolean }
    | { t: "info"; options: { id: string; label: string }[] }
    | { t: "attitude" }
    | { t: "focus"; mode: "lasers" | "crews"; crews: number }
    | { t: "roll"; faces: 6 | 10; tag: string; blurb: string; n: number; crews: number; dieNote: string }
    | { t: "mission" }
    | { t: "refit" }
    | { t: "end" };
}

export type Act =
  | { t: "officer"; name: string }
  | { t: "ship"; name: string }
  | { t: "fit"; fit: Fit }
  | { t: "persona"; n: number }
  | { t: "observe" }
  | { t: "open-route" }
  | { t: "add-seg"; dir: Dir; n: number }
  | { t: "pop-seg" }
  | { t: "land-flag" }
  | { t: "send-route" }
  | { t: "cancel-route" }
  | { t: "open-info" }
  | { t: "spend"; id: string }
  | { t: "close-info" }
  | { t: "attitude"; k: "A" | "B" | "C" | "D"; crews: number }
  | { t: "focus"; n: number }
  | { t: "roll" }
  | { t: "mission"; k: MissionId }
  | { t: "hold" }
  | { t: "lasers" }
  | { t: "deploy"; crews: number; fight: boolean }
  | { t: "reembark" }
  | { t: "open-refit" }
  | { t: "refit"; fit: Fit }
  | { t: "promote" }
  | { t: "rescue" }
  | { t: "nuke" }
  | { t: "abandon" };

export interface DockItem {
  label: string;
  act: Act;
  tone?: "gold" | "seal" | "ghost";
}

const SAVE_KEY = "vii-legio-v1";

export function loadGame(): Game | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as Game;
    if (!g || !g.phase || !g.planets) return null;
    return g;
  } catch {
    return null;
  }
}

export function saveGame(g: Game | null) {
  if (typeof localStorage === "undefined") return;
  if (!g) localStorage.removeItem(SAVE_KEY);
  else localStorage.setItem(SAVE_KEY, JSON.stringify(g));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function d6() {
  return 1 + Math.floor(Math.random() * 6);
}
function d10() {
  return 1 + Math.floor(Math.random() * 10);
}

export function shipOf(g: { shipId: string }): ShipClass {
  return SHIPS.find((s) => s.id === g.shipId) ?? SHIPS[0];
}

export function slotsOf(f: Fit): number {
  return f.crews + f.shields + f.lasers + f.radars + f.computers + f.tanks + f.modules + f.nukes;
}

export function fitError(ship: ShipClass, f: Fit): string | null {
  if (f.crews < ship.minCrews) return `Minimum ${ship.minCrews} équipage${ship.minCrews > 1 ? "s" : ""}.`;
  if (f.radars > ship.maxRadar) return `Radars : maximum ${ship.maxRadar}.`;
  if (f.radars > 3) return "Au-delà de 3 radars, les météores brouillent tout.";
  if (f.tanks > ship.maxTanks) return `Réservoirs : maximum ${ship.maxTanks}.`;
  if (f.nukes > 0 && !ship.nuke) return "Pas d'arme iono-nucléaire sur cette nef.";
  if (f.nukes > 2) return "Deux bombes au plus.";
  if (f.zip + f.ho + f.sil !== f.modules) return "Chaque module porte une arme, une seule.";
  const n = slotsOf(f);
  if (n > ship.slots) return `Postes ${n} / ${ship.slots}.`;
  if ([f.crews, f.shields, f.lasers, f.radars, f.computers, f.tanks, f.modules, f.zip, f.ho, f.sil, f.nukes].some((v) => v < 0 || !Number.isInteger(v)))
    return "Compte invalide.";
  return null;
}

export function starterFit(ship: ShipClass): Fit {
  if (ship.id === "gladium")
    return { crews: 2, shields: 2, lasers: 2, radars: 2, computers: 1, tanks: 3, modules: 0, zip: 0, ho: 0, sil: 0, nukes: 0 };
  if (ship.id === "spatha")
    return { crews: 4, shields: 3, lasers: 2, radars: 2, computers: 2, tanks: 3, modules: 0, zip: 0, ho: 0, sil: 0, nukes: 1 };
  if (ship.id === "hasta")
    return { crews: 6, shields: 3, lasers: 3, radars: 2, computers: 2, tanks: 3, modules: 0, zip: 0, ho: 0, sil: 0, nukes: 1 };
  return { ...EMPTY_FIT };
}

function say(g: Game, who: "sc" | "uc", text: string) {
  g.seq += 1;
  g.log.push({ id: g.seq, who, text });
  if (g.log.length > 400) g.log.splice(0, g.log.length - 400);
}

function note(g: Game, text: string) {
  g.feuille.push(`T${g.turn} — ${text}`);
}

function net(base: number, level: number) {
  return base - level;
}

function radioPen(g: Game, p: Planet | null): number {
  if (g.sector !== "externe" || !p) return 0;
  if (p.radio === "a") return 1;
  if (p.radio === "b") return 2;
  return 0;
}

function weaponFc(kind: "zip" | "ho" | "sil", kingdom: string | undefined): number {
  if (kind === "zip") return 5;
  if (kind === "ho") return kingdom === "animal" ? 6 : kingdom === "vegetal" ? 4 : 3;
  return kingdom === "mineral" ? 6 : 3;
}

function crewLines(g: Game, kingdom: string | undefined, k: number): { att: number; def: number }[] {
  const pen = radioPen(g, g.onPlanet ? planetById(g, g.onPlanet) : null);
  const base = Math.max(0, 3 - pen);
  const kinds: ("zip" | "ho" | "sil")[] = [];
  for (let i = 0; i < g.fit.zip; i++) kinds.push("zip");
  for (let i = 0; i < g.fit.ho; i++) kinds.push("ho");
  for (let i = 0; i < g.fit.sil; i++) kinds.push("sil");
  const out = [];
  for (let i = 0; i < k; i++) {
    const mod = i < g.fit.modules && i < kinds.length;
    const w = mod ? weaponFc(kinds[i], kingdom) : 0;
    out.push({ att: base + w, def: base + (mod ? 1 : 0) });
  }
  return out;
}

function planetById(g: Game, id: string | null): Planet | null {
  if (!id) return null;
  return g.planets.find((p) => p.id === id) ?? null;
}

function here(g: Game): Planet | null {
  return g.planets.find((p) => p.level === g.level && p.x === g.x && p.y === g.y) ?? null;
}

function cheb(ax: number, ay: number, bx: number, by: number) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function describeVector(dx: number, dy: number): { dist: number; text: string } {
  if (dx === 0 && dy === 0) return { dist: 0, text: "sur votre carré" };
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const diag = Math.min(ax, ay);
  const straight = Math.abs(ax - ay);
  const diagName =
    sx === 1 && sy === 1 ? "Nord-Est" : sx === 1 && sy === -1 ? "Sud-Est" : sx === -1 && sy === 1 ? "Nord-Ouest" : "Sud-Ouest";
  const strName = ax > ay ? (sx === 1 ? "Est" : "Ouest") : sy === 1 ? "Nord" : "Sud";
  const parts: string[] = [];
  if (straight) parts.push(`${straight} ${strName}`);
  if (diag) parts.push(`${diag} ${diagName}`);
  return { dist: Math.max(ax, ay), text: parts.join(" + ") };
}

/** PROVISOIRE — table A. Dé 6 et écart +2 ou −4 → F. */
export function tableA(diff: number, die: number): "none" | "F" | "U" {
  const col = diff <= -8 ? 0 : diff <= -4 ? 1 : diff <= -1 ? 2 : diff <= 2 ? 3 : diff <= 5 ? 4 : 5;
  const grid = [
    ["none", "none", "none", "none", "F", "F"],
    ["none", "none", "none", "F", "F", "U"],
    ["none", "none", "F", "F", "U", "U"],
    ["none", "none", "F", "U", "U", "U"],
    ["none", "F", "F", "U", "U", "U"],
    ["F", "F", "F", "F", "U", "U"],
  ] as const;
  const d = Math.min(6, Math.max(1, die));
  return grid[d - 1][col];
}

/** PROVISOIRE — table B. Dé 1, écart −2 → 0. */
export function tableB(diff: number, die: number): number {
  const col = diff >= 4 ? 0 : diff >= 1 ? 1 : diff >= -2 ? 2 : diff >= -5 ? 3 : 4;
  const grid = [
    [0, 0, 0, 1, 2],
    [0, 0, 1, 2, 3],
    [0, 1, 1, 3, 4],
    [1, 1, 2, 3, 5],
    [1, 2, 3, 4, 6],
    [2, 3, 4, 5, 6],
  ];
  const d = Math.min(6, Math.max(1, die));
  return grid[d - 1][col];
}

function tableD(diff: number, die: number): "si" | "dash" | "no" {
  const bump = diff >= 3 ? 2 : diff >= 0 ? 1 : diff >= -3 ? 0 : -1;
  const v = die + bump;
  if (v >= 7) return "si";
  if (v >= 4) return "dash";
  return "no";
}

function tableE(fall: number, die: number, persona: number, external: boolean): "si" | "dash" | "no" {
  const d = die - (external ? persona : 0);
  if (d >= fall + 3) return "si";
  if (d >= fall) return "dash";
  return "no";
}

function tableG(die: number, persona: number, external: boolean): number {
  const d = die - (external ? persona : 0);
  return Math.max(0, d - 1);
}

const C_PARTS = ["shields", "lasers", "radars", "computers", "tanks", "hull"] as const;

function living(p: Planet) {
  return p.beings.filter((b) => b.alive);
}

function killFc(list: Being[], half: boolean) {
  const alive = list.filter((b) => b.alive);
  if (!half) {
    alive.forEach((b) => (b.alive = false));
    return alive.length;
  }
  const total = alive.reduce((s, b) => s + Math.max(1, b.def), 0);
  let need = Math.ceil(total / 2);
  let n = 0;
  for (const b of alive) {
    if (need <= 0) break;
    b.alive = false;
    need -= Math.max(1, b.def);
    n += 1;
  }
  return n;
}

function spawn(g: Game, p: Planet, count: number) {
  const race = p.raceId ? raceById(p.raceId) : undefined;
  if (!race || count <= 0 || race.missions.includes("collect")) return;
  const legioAtt = Math.max(1, g.fit.lasers * 6);
  for (let i = 0; i < count; i++) {
    g.beingSeq += 1;
    let att = 1;
    let def = 1;
    if (race.fc === "mirror") {
      att = Math.max(1, g.fit.shields > 0 ? g.fit.shields * 5 : 2);
      def = legioAtt;
    } else if (race.id === "attlers") {
      const die = d6();
      def = legioAtt;
      att = legioAtt + die;
    } else if (race.id === "cronos") {
      const die = d6();
      def = legioAtt;
      att = Math.max(1, legioAtt * die);
    } else if (typeof race.fc === "number") {
      att = race.fc;
      def = race.fc;
    }
    p.beings.push({ uid: g.beingSeq, att, def, alive: true });
  }
}

function applyC(g: Game, times: number): string {
  if (times <= 0) return "Aucun dégât à répartir.";
  const bits: string[] = [];
  let prevHull = false;
  let dead = false;
  for (let i = 0; i < times; i++) {
    const die = d6();
    const part = C_PARTS[die - 1];
    if (part === "hull") {
      if (prevHull) {
        bits.push("coque, puis coque encore — la nef se disloque");
        dead = true;
        break;
      }
      bits.push("coque (tenue, cette fois)");
      prevHull = true;
      continue;
    }
    prevHull = false;
    const key = part;
    if (g.fit[key] <= 0) {
      bits.push(`${labelPart(part)} — vous n'en avez pas, coup nul`);
      continue;
    }
    g.fit[key] -= 1;
    if (part === "radars") g.fit.radars = Math.max(0, g.fit.radars);
    bits.push(`${labelPart(part)} détruit`);
    if (part === "tanks" && g.men > 0) {
      /* réservoir seulement */
    }
  }
  if (dead) {
    bits.push("Porte de sauvetage.");
    wreck(g, "Deux atteintes successives à la coque.");
  }
  return bits.join(". ") + ".";
}

function labelPart(p: string) {
  if (p === "shields") return "bouclier";
  if (p === "lasers") return "laser de bord";
  if (p === "radars") return "radar";
  if (p === "computers") return "Mater";
  if (p === "tanks") return "réservoir";
  return "coque";
}

function sunkSince(g: Game, since: number) {
  return g.log.some((m) => m.id > since && m.text.includes("porte hyperspatiale"));
}

function wreck(g: Game, why: string) {
  const ship = shipOf(g);
  const idx = SHIPS.findIndex((s) => s.id === ship.id);
  say(g, "sc", `${why} L'Espace Ordinateur ouvre la porte hyperspatiale. Vos points retombent à zéro.`);
  if (idx <= 0) {
    g.rank = "decurio";
    g.shipId = "frombola";
    say(g, "sc", "Decurio vous étiez, Decurio vous restez. Une Frombola neuve vous attend au bassin.");
  } else {
    const lower = SHIPS[idx - 1];
    g.shipId = lower.id;
    g.rank = lower.rank;
    say(g, "sc", `Vous reprenez au grade de ${RANK_LABEL[lower.rank]}, nef ${lower.name}.`);
  }
  g.points = 0;
  g.fit = starterFit(shipOf(g));
  g.men = g.fit.crews * 3;
  g.ashore = 0;
  g.shieldsUp = false;
  const base = g.planets.find((p) => p.base);
  if (base) {
    g.level = base.level;
    g.x = base.x;
    g.y = base.y;
    g.onPlanet = base.id;
  }
  g.needArrivals = false;
  g.infoLeft = g.fit.computers;
  g.phase = { t: "play" };
  note(g, "porte de sauvetage — points annulés");
}

function menDie(g: Game, n: number, where: "ashore" | "ship") {
  const ship = shipOf(g);
  const lost = Math.max(0, n);
  if (where === "ashore") g.ashore = Math.max(0, g.ashore - lost);
  g.men = Math.max(0, g.men - lost);
  if (ship.level >= 2 && lost > 0) {
    g.points -= lost;
    say(g, "sc", `${lost} homme${lost > 1 ? "s" : ""} perdu${lost > 1 ? "s" : ""}. Sur une nef de niveau ${ship.level}, cela coûte ${lost} point${lost > 1 ? "s" : ""}.`);
  }
}

function hostileNow(p: Planet): boolean {
  if (p.angered) return true;
  return p.temperament === "hostile";
}

function alienStrike(g: Game, p: Planet, target: "ship" | "one-crew" | "all-crews") {
  const race = p.raceId ? raceById(p.raceId) : undefined;
  const alive = living(p);
  if (!alive.length) {
    say(g, "sc", "Plus rien de vivant ne vous répond.");
    return;
  }
  if (race?.shipsImmune && target === "ship") {
    say(g, "sc", `${race.name} roule contre la coque sans la marquer. Ils ne savent blesser que les hommes au sol.`);
    return;
  }
  if ((target === "one-crew" || target === "all-crews") && g.ashore <= 0) {
    if (race?.shipsImmune) {
      say(g, "sc", "Vos équipages sont à l'abri. Cette race n'atteint pas la nef.");
      return;
    }
    target = "ship";
  }
  const att = alive.reduce((s, b) => s + b.att, 0);
  let def = 2;
  if (target === "ship") def = g.shieldsUp && g.fit.shields > 0 ? g.fit.shields * 5 : 2;
  else if (target === "all-crews") {
    const lines = crewLines(g, p.kingdom, Math.max(1, Math.floor(g.ashore / 3)));
    def = Math.max(1, lines.reduce((s, l) => s + l.def, 0));
  } else {
    const lines = crewLines(g, p.kingdom, Math.max(1, Math.floor(g.ashore / 3)));
    def = lines.length ? Math.min(...lines.map((l) => l.def)) : 1;
  }
  const die = d6();
  let dmg = tableB(def - att, die);
  if (race?.poison && target !== "ship") dmg *= 2;
  if (race?.id === "ipnotici" && target !== "ship" && dmg > 0) dmg += dmg % 2 === 1 ? 1 : 0;
  say(
    g,
    "sc",
    `Je lance pour eux. Dé ${die}. Écart ${def - att}. Table B ${proviso()} : ${dmg === 0 ? "rien" : dmg + " point" + (dmg > 1 ? "s" : "")}.`,
  );
  ensureSuffered(p);
  if (dmg <= 0) {
    say(g, "sc", "Ils vous manquent.");
    return;
  }
  if (target === "ship") {
    say(g, "sc", applyC(g, dmg));
  } else {
    menDie(g, dmg, "ashore");
    say(g, "sc", `${dmg} homme${dmg > 1 ? "s" : ""} au sol. Il vous reste ${g.men} homme${g.men > 1 ? "s" : ""} à la nef, dont ${g.ashore} dehors.`);
  }
}

function gSuffered(p: Planet) {
  p.suffered = true;
  p.angered = true;
}

declare module "./engine" {}

function proviso() {
  return "(table provisoire)";
}

// patch method-like without prototype
function ensureSuffered(p: Planet) {
  p.suffered = true;
  p.angered = true;
}

function scanFrom(g: Game, level: number, x: number, y: number, parsecLabel: string) {
  const radar = Math.min(g.fit.radars, 3);
  if (radar <= 0) return;
  const ship = shipOf(g);
  for (const p of g.planets) {
    if (p.level !== level || p.base && false) continue;
    if (p.level !== level) continue;
    const dist = cheb(x, y, p.x, p.y);
    if (dist <= 0 || dist > radar) continue;
    const v = describeVector(p.x - x, p.y - y);
    if (p.base) {
      if (!p.sighted) {
        p.sighted = true;
        say(g, "sc", `${parsecLabel} la base. Distance ${v.dist}. Direction ${v.text}.`);
        note(g, `${parsecLabel} base — ${v.text}`);
      }
      continue;
    }
    if (!p.sighted) {
      p.sighted = true;
      const gain = net(2, ship.level);
      g.points += gain;
      say(
        g,
        "sc",
        `${parsecLabel} un monde jamais vu. Distance ${v.dist}. Direction ${v.text}. La République vous alloue ${gain} point${gain > 1 ? "s" : ""} (2, moins le niveau ${ship.level}).`,
      );
      note(g, `${parsecLabel} monde inconnu — ${v.text} — ${gain} pts`);
    } else if (p.barred) {
      say(g, "sc", `${parsecLabel} un monde notoire. Distance ${v.dist}. Direction ${v.text}. ${knownLine(g, p)}`);
    } else if (p.revealed > 0) {
      say(g, "sc", `${parsecLabel} un monde déjà au dossier. Distance ${v.dist}. Direction ${v.text}. ${knownLine(g, p)}`);
    } else {
      say(g, "sc", `${parsecLabel} le monde déjà signalé. Distance ${v.dist}. Direction ${v.text}.`);
    }
  }
}

function knownLine(g: Game, p: Planet): string {
  const bits = [];
  if (p.typeName) bits.push(`type ${p.typeName} (${p.typeId})`);
  if (p.kingdom) bits.push(kingdomFr(p.kingdom));
  if (p.raceId) bits.push(raceById(p.raceId)?.name ?? p.raceId);
  if (!bits.length) return "Rien de plus au dossier.";
  return "Déjà noté : " + bits.join(", ") + ".";
}

function kingdomFr(k: string) {
  if (k === "animal") return "vie animale";
  if (k === "vegetal") return "vie végétale";
  if (k === "mineral") return "vie minérale";
  if (k === "secor") return "Secor";
  if (k === "sterile") return "stérile";
  return k;
}

function contacts(g: Game): { id: string; label: string }[] {
  const radar = Math.min(g.fit.radars, 3);
  if (radar <= 0) return [];
  const out = [];
  for (const p of g.planets) {
    if (p.base || p.level !== g.level) continue;
    const dist = cheb(g.x, g.y, p.x, p.y);
    if (dist <= 0 || dist > radar) continue;
    if (!p.sighted) continue;
    const v = describeVector(p.x - g.x, p.y - g.y);
    const tag = p.raceId ? raceById(p.raceId)?.name : p.typeName ? `type ${p.typeName}` : "sans dossier";
    out.push({ id: p.id, label: `${tag} — ${v.text}` });
  }
  return out;
}

function advance(g: Game, p: Planet): string {
  if (p.base) return "C'est la base. Il n'y a rien à traduire.";
  if (p.revealed >= 6) return "Le dossier est complet. " + dossier(g, p, true);
  if (p.revealed === 0) {
    const die = d10();
    if (die === 10) return `Dé 10 : ${die}. D.N.S. Les données ne suffisent pas. Cette demande est perdue.`;
    const ty = PLANET_TYPES[die - 1];
    p.typeId = ty.id;
    p.typeName = ty.name;
    if (g.sector === "externe") {
      const r = d6();
      p.radio = r <= 2 ? "0" : r <= 4 ? "a" : "b";
    }
    p.revealed = 1;
    const rad =
      g.sector === "externe"
        ? ` Radioactivité ${p.radio === "0" ? "nulle" : p.radio === "a" ? "alpha" : "bêta"}.`
        : "";
    note(g, `info I — ${ty.name} (${ty.id})`);
    return `Dé 10 : ${die}. Type ${ty.name}, lettre ${ty.id}.${rad}`;
  }
  if (p.revealed === 1 && p.kingdom === "sterile") {
    p.revealed = 6;
    return "Monde stérile. Rien à ajouter.";
  }
  if (p.revealed === 1) {
    const die = d6();
    const row = KINGDOM_BY_TYPE[p.typeId ?? "A"];
    const cell = row[die - 1];
    if (cell === "dns") return `Dé 6 : ${die}. D.N.S. Demande perdue.`;
    p.kingdom = cell;
    p.revealed = 2;
    note(g, `info II — ${kingdomFr(cell)}`);
    if (cell === "sterile") {
      p.revealed = 6;
      return `Dé 6 : ${die}. Aucune forme de vie.`;
    }
    if (cell === "secor") {
      p.raceId = "secor";
      p.temperament = "pacific";
      p.revealed = 6;
      return `Dé 6 : ${die}. Fleurs Secor. ${raceById("secor")?.blurb}`;
    }
    return `Dé 6 : ${die}. ${kingdomFr(cell)}.`;
  }
  if (p.revealed === 2) {
    if (p.kingdom === "mineral") {
      const die = d10();
      if (die <= 4) {
        p.band = "oz";
        p.raceId = "oz";
        p.temperament = "pacific";
        p.revealed = 6;
        note(g, "info — minéraux d'OZ");
        return `Dé 10 : ${die}. Minéraux d'OZ. ${raceById("oz")?.blurb}`;
      }
      return `Dé 10 : ${die}. D.N.S. — les formes minérales autres que l'OZ ne sont pas chiffrées dans cette version. Demande perdue.`;
    }
    const die = d10();
    if (die === 10) return `Dé 10 : ${die}. D.N.S. Demande perdue.`;
    p.band = die <= 6 ? "non" : "sapiens";
    p.revealed = 3;
    note(g, `info III — ${p.band === "non" ? "non sapiens" : "sapiens"}`);
    return `Dé 10 : ${die}. Formes ${p.band === "non" ? "non sapiens" : "sapiens"}.`;
  }
  if (p.revealed === 3) {
    const die = d6();
    let subtype = "";
    if (p.band === "non") subtype = die <= 3 ? "poison" : "monstra";
    else subtype = die <= 2 ? "sub" : die <= 4 ? "civiles" : "super";
    const kingdom = p.kingdom === "animal" || p.kingdom === "vegetal" ? p.kingdom : "vegetal";
    const pool = RACES.filter((r) => r.kingdom === kingdom && r.klass === subtype);
    if (!pool.length) return `Dé 6 : ${die}. D.N.S. — aucune fiche pour ${kingdomFr(kingdom)}, ${subtype}. Demande perdue.`;
    const race = pool[(die - 1) % pool.length];
    p.raceId = race.id;
    p.temperament = race.temperament;
    p.revealed = 4;
    note(g, `info IV — ${race.name}`);
    return `Dé 6 : ${die}. ${race.name}. ${race.blurb}`;
  }
  if (p.revealed === 4) {
    p.revealed = 5;
    const race = raceById(p.raceId ?? "");
    const temp = p.temperament === "hostile" ? "hostiles" : p.temperament === "merchant" ? "marchands" : "pacifiques";
    return `${race?.name ?? "Eux"} sont ${temp}. Missions ouvertes : ${missionsFr(race)}.`;
  }
  const race = raceById(p.raceId ?? "");
  p.revealed = 6;
  return dossier(g, p, false) || (race ? `Facteur ${race.fc}.` : "Dossier clos.");
}

function missionsFr(race: Race | undefined) {
  if (!race) return "aucune";
  const map: Record<string, string> = {
    elim: "élimination",
    capture: "capture",
    alliance: "alliance",
    intim: "intimidation",
    trade: "troc",
    collect: "cueillette",
  };
  return race.missions.map((m) => map[m]).join(", ");
}

function dossier(g: Game, p: Planet, full: boolean): string {
  const race = p.raceId ? raceById(p.raceId) : undefined;
  if (!race) return knownLine(g, p);
  const fc =
    typeof race.fc === "number"
      ? `F.C. ${race.fc}`
      : "F.C. en miroir du vôtre, calculé au contact";
  let extra = "";
  if (g.sector === "externe") {
    extra = ` Milieu préféré : ${race.pref} (+${race.prefBonus}). Milieu non vital : ${race.nonvital}. Technologie : ${race.tech ?? "—"}.`;
  }
  const pts = [];
  if (race.elim) pts.push(`élimination ${race.elim}`);
  if (race.capture) pts.push(`capture ${race.capture}`);
  if (race.alliance) pts.push(`alliance ${race.alliance} (F.${race.fall})`);
  return `${race.name}. ${fc}. ${race.blurb} Gains avant niveau de nef : ${pts.join(", ") || "—"}.${extra} ${race.note}`;
}

function dumpRest(g: Game, p: Planet) {
  let guard = 0;
  const lines: string[] = [];
  while (p.revealed < 6 && guard < 8) {
    const before = p.revealed;
    const line = advance(g, p);
    lines.push(line);
    if (p.revealed === before) break;
    guard += 1;
  }
  return lines.join(" ");
}

function presence(g: Game, p: Planet) {
  const race = p.raceId ? raceById(p.raceId) : undefined;
  if (!race || race.missions.includes("collect")) {
    p.presenceRolled = true;
    say(g, "sc", "Rien qui se compte comme un être en face.");
    return;
  }
  const die = d6();
  const n = race.presence[die - 1] ?? 0;
  p.presenceRolled = true;
  spawn(g, p, n);
  const temp = hostileNow(p) ? "hostiles" : p.temperament === "merchant" ? "marchands" : "pacifiques";
  say(
    g,
    "sc",
    `Présences, dé ${die} : ${n} ${race.name}, ${temp}. ${typeof race.fc === "number" ? `F.C. ${race.fc} chacun.` : "Leur facteur se cale sur le vôtre."} ${g.sector === "interne" ? "Je ne vous lis ni le milieu préféré, ni le milieu non vital, ni le niveau technologique." : ""}`,
  );
}

function arrivals(g: Game, p: Planet) {
  const race = p.raceId ? raceById(p.raceId) : undefined;
  if (!race || race.missions.includes("collect") || !p.presenceRolled) return;
  const die = d6();
  const n = race.arrivals[die - 1] ?? 0;
  if (n <= 0) {
    say(g, "sc", `Arrivées, dé ${die} : personne de plus.`);
    return;
  }
  spawn(g, p, n);
  say(g, "sc", `Arrivées, dé ${die} : ${n} ${race.name} de plus. Ils sont ${living(p).length} en face.`);
}

function finishStay(g: Game) {
  g.turn += 1;
  g.infoLeft = g.fit.computers;
  if (g.onPlanet) {
    const p = planetById(g, g.onPlanet);
    if (p && !p.base) {
      arrivals(g, p);
    }
  }
  g.phase = { t: "play" };
}

function cashAndBar(g: Game, p: Planet, brought: number) {
  if (!p.base) {
    if (p.hadCrew && brought >= 3 && p.pending !== 0) {
      g.points += p.pending;
      say(g, "sc", `Un équipage complet rentre. Points de mission : ${p.pending}. Total ${g.points}.`);
      note(g, `mission ${p.pending} pts`);
    } else if (p.pending !== 0) {
      say(g, "sc", "Pas d'équipage complet au retour. Les points de mission sont perdus.");
    }
    p.pending = 0;
    p.barred = true;
    say(g, "sc", "Ce monde est notoire. Plus personne n'y reprendra de points.");
    note(g, `${p.raceId ?? p.typeName ?? "monde"} — notoire`);
  }
  g.onPlanet = null;
  g.ashore = 0;
  g.shieldsUp = false;
}

export function newGame(sector: "interne" | "externe"): Game {
  const rng = mulberry32((Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0);
  const ri = (n: number) => Math.floor(rng() * n);
  const planets: Planet[] = [];
  const occupied: { level: number; x: number; y: number }[] = [];
  for (let level = 0; level < 4; level++) {
    let guard = 0;
    let placed = 0;
    while (placed < 9 && guard < 5000) {
      guard += 1;
      const x = ri(GRID);
      const y = ri(GRID);
      if (occupied.some((o) => o.level === level && cheb(o.x, o.y, x, y) < 3)) continue;
      occupied.push({ level, x, y });
      const base = false;
      planets.push(blankPlanet(`L${level}M${placed}`, level, x, y, base));
      placed += 1;
    }
  }
  const basePool = planets.filter((p) => p.level === 1);
  const base = basePool[ri(basePool.length)] ?? planets[0];
  base.base = true;
  base.name = "BASE";
  base.sighted = true;
  base.revealed = 6;

  let bh: Game["bh"] = null;
  const rmg: Game["rmg"] = [];
  const dn: Game["dn"] = [];
  if (sector === "externe") {
    for (let i = 0; i < 80 && !bh; i++) {
      const x = ri(GRID);
      const y = ri(GRID);
      if (planets.every((p) => cheb(p.x, p.y, x, y) >= 5)) bh = { x, y };
    }
    for (let level = 0; level < 4; level++) {
      for (let t = 0; t < 40; t++) {
        const cells = walk3(rng, level, planets);
        if (cells) {
          rmg.push(...cells);
          break;
        }
      }
      let made = 0;
      let guard = 0;
      while (made < 3 && guard < 200) {
        guard += 1;
        const x = ri(GRID);
        const y = ri(GRID);
        if (planets.some((p) => p.level === level && cheb(p.x, p.y, x, y) < 4)) continue;
        if (rmg.some((c) => c.level === level && c.x === x && c.y === y)) continue;
        if (dn.some((c) => c.level === level && c.x === x && c.y === y)) continue;
        dn.push({ level, x, y });
        made += 1;
      }
    }
  }

  const g: Game = {
    sector,
    officer: "",
    shipName: "",
    rank: "decurio",
    points: 0,
    shipId: "frombola",
    fit: { ...EMPTY_FIT },
    men: 3,
    ashore: 0,
    persona: 0,
    turn: 1,
    level: base.level,
    x: base.x,
    y: base.y,
    onPlanet: base.id,
    shieldsUp: false,
    needArrivals: false,
    infoLeft: 0,
    seq: 0,
    beingSeq: 0,
    planets,
    bh,
    rmg,
    dn,
    log: [],
    feuille: [],
    phase: { t: "officer" },
  };
  say(
    g,
    "sc",
    `Ici l'Espace Ordinateur de la VIIe Legio. Secteur ${sector === "interne" ? "interne, niveau basique" : "externe, niveau avancé"}. Je tiens la tabula. Vous ne la verrez pas. Feuille, crayon, fiche de nef. Nommez-vous.`,
  );
  return g;
}

function blankPlanet(id: string, level: number, x: number, y: number, base: boolean): Planet {
  return {
    id,
    name: id,
    level,
    x,
    y,
    base,
    barred: false,
    sighted: false,
    revealed: 0,
    radio: "0",
    beings: [],
    angered: false,
    presenceRolled: false,
    pending: 0,
    hadCrew: false,
    suffered: false,
    fired: false,
    allianceTries: 0,
    allianceLocked: false,
    tradeTurns: 0,
    collected: false,
    elimPaid: false,
  };
}

function walk3(
  rng: () => number,
  level: number,
  planets: Planet[],
): { level: number; x: number; y: number }[] | null {
  const x0 = Math.floor(rng() * GRID);
  const y0 = Math.floor(rng() * GRID);
  const cells = [{ level, x: x0, y: y0 }];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let i = 0; i < 2; i++) {
    const last = cells[cells.length - 1];
    const d = dirs[Math.floor(rng() * 4)];
    const x = last.x + d[0];
    const y = last.y + d[1];
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return null;
    if (cells.some((c) => c.x === x && c.y === y)) return null;
    cells.push({ level, x, y });
  }
  if (cells.some((c) => planets.some((p) => p.level === level && cheb(p.x, p.y, c.x, c.y) < 4))) return null;
  return cells;
}

function stepDelta(dir: Dir): [number, number] | "up" | "down" {
  if (dir === "HAUT") return "up";
  if (dir === "BAS") return "down";
  const map: Record<string, [number, number]> = {
    N: [0, 1],
    NE: [1, 1],
    E: [1, 0],
    SE: [1, -1],
    S: [0, -1],
    SO: [-1, -1],
    O: [-1, 0],
    NO: [-1, 1],
  };
  return map[dir];
}

function ordinal(n: number) {
  return n === 1 ? "1er" : `${n}e`;
}

export function routeCost(segs: { dir: Dir; n: number }[]): number {
  return segs.reduce((s, seg) => s + (seg.dir === "HAUT" || seg.dir === "BAS" ? 4 : seg.n), 0);
}

function fly(g: Game, segs: { dir: Dir; n: number }[], landing: boolean) {
  const seq0 = g.seq;
  const ship = shipOf(g);
  const budget = g.fit.tanks * ship.thrust;
  const cost = routeCost(segs);
  if (cost <= 0) {
    say(g, "sc", "Route vide. Je ne bouge pas.");
    return;
  }
  if (cost > budget) {
    say(g, "sc", `Cette route coûte ${cost} parsecs. Vos réservoirs n'en donnent que ${budget}.`);
    return;
  }
  if (g.ashore > 0) {
    say(g, "sc", "Des hommes sont encore au sol.");
    return;
  }
  const leaving = g.onPlanet ? planetById(g, g.onPlanet) : here(g);
  if (leaving && !leaving.base && g.onPlanet) {
    cashAndBar(g, leaving, g.men);
  } else if (leaving?.base) {
    g.onPlanet = null;
  }

  const declared = segs.map((s) => (s.dir === "HAUT" || s.dir === "BAS" ? `4 ${DIR_LABEL[s.dir]}` : `${s.n} ${DIR_LABEL[s.dir]}`)).join(" + ");
  say(g, "uc", `Route : ${declared}. Radars ${g.fit.radars}. Réservoirs ${g.fit.tanks}. ${landing ? "Atterrissage en fin de route." : "Pas d'atterrissage."}`);
  note(g, `route ${declared} — radars ${g.fit.radars}${landing ? " — atterrissage" : ""}`);

  let x = g.x;
  let y = g.y;
  let lv = g.level;
  let parsec = 0;
  const radar = Math.min(g.fit.radars, 3);
  const flown: { x: number; y: number; lv: number; parsec: number }[] = [{ x, y, lv, parsec: 0 }];
  let stopNote: string | null = null;
  let landOn: Planet | null = null;
  let silent = false;
  let distorted = false;

  const planetAt = (l: number, px: number, py: number) => g.planets.find((p) => p.level === l && p.x === px && p.y === py) ?? null;

  outer: for (let si = 0; si < segs.length; si++) {
    const seg = segs[si];
    const lastSeg = si === segs.length - 1;
    const delta = stepDelta(seg.dir);
    if (delta === "up" || delta === "down") {
      const next = lv + (delta === "up" ? 1 : -1);
      parsec += 4;
      if (next < 0 || next > 3) {
        stopNote = `Niveau inexistant. Arrêt au ${ordinal(parsec)} parsec, sur la limite.`;
        break;
      }
      lv = next;
      const dnHit = g.sector === "externe" && g.dn.some((c) => c.level === lv && c.x === x && c.y === y);
      if (dnHit) {
        stopNote = `Distorsion Nullius au ${ordinal(parsec)} parsec. La route meurt ici. D'où vous repartez, je ne le dis pas.`;
        distorted = true;
        break;
      }
      if (g.sector === "externe" && g.rmg.some((c) => c.level === lv && c.x === x && c.y === y)) {
        silent = true;
        break;
      }
      flown.push({ x, y, lv, parsec });
      continue;
    }
    for (let i = 0; i < seg.n; i++) {
      const nx = x + delta[0];
      const ny = y + delta[1];
      const stepIndex = parsec + 1;
      const isFinal = lastSeg && i === seg.n - 1;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
        stopNote = `Limite de la tabula au ${ordinal(stepIndex)} parsec.`;
        break outer;
      }
      const ahead = planetAt(lv, nx, ny);
      if (ahead) {
        const want = landing && isFinal;
        if (want && ahead.base) {
          x = nx;
          y = ny;
          parsec = stepIndex;
          landOn = ahead;
          flown.push({ x, y, lv, parsec });
          break outer;
        }
        if (want && !ahead.barred) {
          x = nx;
          y = ny;
          parsec = stepIndex;
          landOn = ahead;
          flown.push({ x, y, lv, parsec });
          break outer;
        }
        if (want && ahead.barred) {
          stopNote = `Monde notoire. Atterrissage refusé. Je vous arrête au ${ordinal(parsec)} parsec.`;
          break outer;
        }
        if (radar <= 0 && !ahead.barred) {
          x = nx;
          y = ny;
          parsec = stepIndex;
          landOn = ahead;
          stopNote = "Sans radar, atterrissage forcé.";
          flown.push({ x, y, lv, parsec });
          break outer;
        }
        if (radar <= 0 && ahead.barred) {
          stopNote = `Monde notoire sur la route, et pas de radar. Arrêt au ${ordinal(parsec)} parsec.`;
          break outer;
        }
        // stop at first square of the route that already sees this world
        let brake = -1;
        for (let f = 0; f < flown.length; f++) {
          const cell = flown[f];
          if (cell.lv !== lv) continue;
          const d = cheb(cell.x, cell.y, ahead.x, ahead.y);
          if (d > 0 && d <= radar) {
            brake = f;
            break;
          }
        }
        if (brake >= 0) {
          const cell = flown[brake];
          x = cell.x;
          y = cell.y;
          lv = cell.lv;
          parsec = cell.parsec;
          flown.splice(brake + 1);
          stopNote = `La route traversait un monde. Je vous arrête au ${parsec === 0 ? "point de départ" : ordinal(parsec) + " parsec"}, première portée radar.`;
        } else {
          stopNote = `Monde sur la route. Arrêt au ${ordinal(parsec)} parsec.`;
        }
        break outer;
      }
      x = nx;
      y = ny;
      parsec = stepIndex;
      if (g.sector === "externe" && g.dn.some((c) => c.level === lv && c.x === x && c.y === y)) {
        stopNote = `Distorsion Nullius au ${ordinal(parsec)} parsec. La route meurt ici. D'où vous repartez, je ne le dis pas.`;
        distorted = true;
        flown.push({ x, y, lv, parsec });
        break outer;
      }
      if (g.sector === "externe" && g.rmg.some((c) => c.level === lv && c.x === x && c.y === y)) {
        silent = true;
        flown.push({ x, y, lv, parsec });
        break outer;
      }
      flown.push({ x, y, lv, parsec });
    }
  }

  g.x = x;
  g.y = y;
  g.level = lv;

  if (distorted && g.sector === "externe") {
    const d1 = d6();
    const d2 = d6();
    const dirs: Dir[] = ["N", "E", "S", "O", "HAUT", "BAS"];
    const dir = dirs[d1 - 1];
    let tx = g.x;
    let ty = g.y;
    let tl = g.level;
    if (dir === "HAUT" || dir === "BAS") {
      const nl = tl + (dir === "HAUT" ? 1 : -1);
      if (nl >= 0 && nl <= 3) tl = nl;
    } else {
      const delta = stepDelta(dir) as [number, number];
      for (let i = 0; i < d2; i++) {
        const nx = tx + delta[0];
        const ny = ty + delta[1];
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) break;
        tx = nx;
        ty = ny;
      }
    }
    g.x = tx;
    g.y = ty;
    g.level = tl;
    const forced = here(g);
    if (forced && !forced.base && !forced.barred) {
      landOn = forced;
      stopNote = (stopNote ?? "") + " À la sortie, atterrissage forcé.";
    } else if (forced?.base) {
      landOn = forced;
      stopNote = (stopNote ?? "") + " À la sortie, vous êtes sur la base.";
    }
  }

  if (stopNote && !silent) say(g, "sc", stopNote);

  if (silent) say(g, "sc", "La route se coupe. Je n'en donne pas la cause.");

  // sightings along flown cells (declared geometry, not the secret DN exit)
  const seenKey = new Set<string>();
  for (const cell of flown) {
    const label = cell.parsec === 0 ? "Au point de départ," : `Au ${ordinal(cell.parsec)} parsec,`;
    const before = g.log.length;
    scanFrom(g, cell.lv, cell.x, cell.y, label);
    if (g.log.length === before) seenKey.add(label);
  }

  if (g.sector === "externe" && g.bh) {
    const start = flown[0];
    const startD = cheb(start.x, start.y, g.bh.x, g.bh.y);
    let minD = startD;
    let at = 0;
    for (const cell of flown) {
      if (cell.lv !== start.lv && cell.lv !== g.level) {
        /* distance is on each level to the same square */
      }
      const d = cheb(cell.x, cell.y, g.bh.x, g.bh.y);
      if (d < minD) {
        minD = d;
        at = cell.parsec;
      }
    }
    if (minD <= 4 && minD < startD) {
      const die = d6();
      const raw = minD - ship.level - die;
      say(g, "sc", `Au ${at === 0 ? "départ" : ordinal(at) + " parsec"}, le vide pèse. Distance ${minD}, masse ${ship.level}, dé ${die}.`);
      if (raw < 0) {
        say(g, "sc", applyC(g, -raw));
        if (sunkSince(g, seq0)) return;
      } else say(g, "sc", "La formule reste positive. Pas de dégât.");
    }
  }

  if (sunkSince(g, seq0)) {
    g.phase = { t: "play" };
    g.infoLeft = g.fit.computers;
    return;
  }

  if (landOn) {
    g.x = landOn.x;
    g.y = landOn.y;
    g.level = landOn.level;
    g.onPlanet = landOn.id;
    if (landOn.base) {
      say(g, "sc", `La ${shipOf(g).name} ${g.shipName || ""} se pose sur la base. Les droidi attendent. Points : ${g.points}.`);
      note(g, "posé sur la base");
      g.shieldsUp = false;
      g.phase = { t: "play" };
      g.infoLeft = g.fit.computers;
      return;
    }
    say(g, "sc", "Rotte d'atterrissage exécutée. Avant que je complète le dossier, déclarez votre attitude. Les hommes ne descendent pas deux fois dans le même tour, et les boucliers interdisent la rampe.");
    g.phase = { t: "attitude" };
    return;
  }

  g.onPlanet = null;
  if (!stopNote && !silent) {
    say(g, "sc", landing ? "Fin de route. Pas de monde sous la nef." : "Route tenue.");
  }
  g.turn += 1;
  g.infoLeft = g.fit.computers;
  const opts = contacts(g);
  if (g.infoLeft > 0 && opts.length) {
    say(g, "sc", `Il vous reste ${g.infoLeft} Mater. Voulez-vous une traduction ?`);
    g.phase = { t: "info", options: opts };
  } else {
    if (g.fit.computers <= 0) say(g, "sc", "Sans Mater, je ne traduis rien. Les routes, je les suis quand même.");
    g.phase = { t: "play" };
  }
}

function beginClash(g: Game, mode: "lasers" | "crews", crews: number, count: number) {
  const p = planetById(g, g.onPlanet);
  if (!p) return;
  const alive = living(p);
  const n = Math.max(1, Math.min(count, alive.length));
  const targets = alive.slice(0, n);
  const race = p.raceId ? raceById(p.raceId) : undefined;
  const kingdom = p.kingdom;
  let att = 0;
  if (mode === "lasers") att = g.fit.lasers * 6;
  else att = crewLines(g, kingdom, crews).reduce((s, l) => s + l.att, 0);
  const def = targets.reduce((s, b) => s + b.def, 0);
  g.phase = {
    t: "roll",
    faces: 6,
    tag: mode,
    blurb: `Feu ${mode === "lasers" ? "des lasers" : "des équipages"} sur ${n}. Votre facteur ${att}, le leur ${def}. Lancez le dé.`,
    n,
    crews,
    dieNote: "",
  };
}

function resolveRoll(g: Game, die: number) {
  const seq0 = g.seq;
  const ph = g.phase;
  if (ph.t !== "roll") return;
  const p = planetById(g, g.onPlanet);
  if (!p) {
    g.phase = { t: "play" };
    return;
  }
  const ship = shipOf(g);
  const race = p.raceId ? raceById(p.raceId) : undefined;
  say(g, "uc", `Dé : ${die}.`);

  if (ph.tag === "lasers" || ph.tag === "crews") {
    const alive = living(p);
    const targets = alive.slice(0, Math.max(1, ph.n));
    const kingdom = p.kingdom;
    const att =
      ph.tag === "lasers" ? g.fit.lasers * 6 : crewLines(g, kingdom, ph.crews).reduce((s, l) => s + l.att, 0);
    const def = targets.reduce((s, b) => s + b.def, 0) || 1;
    const res = tableA(att - def, die);
    p.fired = true;
    if (res === "U") {
      targets.forEach((b) => (b.alive = false));
      say(g, "sc", `Table A ${proviso()}, écart ${att - def} : U. Ceux que vous visiez sont morts.`);
    } else if (res === "F") {
      const killed = killFc(targets, true);
      say(g, "sc", `Table A ${proviso()}, écart ${att - def} : F. Moitié des facteurs, arrondi au supérieur. ${killed} abattu${killed > 1 ? "s" : ""}.`);
    } else say(g, "sc", `Table A ${proviso()}, écart ${att - def} : rien.`);
    if (res !== "none") {
      p.angered = true;
      grantElim(g, p, ph.tag === "lasers", die);
    }
    const pac = !hostileNow(p) && !p.angered;
    // angered just set if we hit; survivors shoot if we fired on pacific (after) or hostile (same time narrated after)
    if (living(p).length && (p.angered || race?.temperament === "hostile")) {
      const target = g.ashore > 0 ? "one-crew" : "ship";
      if (!(pac && res === "none")) alienStrike(g, p, target);
    }
    if (g.phase.t === "roll") g.phase = { t: "play" };
    if (!sunkSince(g, seq0)) finishStay(g);
    return;
  }

  if (ph.tag === "capture") {
    const alive = living(p);
    const att = crewLines(g, p.kingdom, Math.max(1, Math.floor(g.ashore / 3))).reduce((s, l) => s + Math.max(0, l.att - weaponOf(l)), 0);
    // without weapons: men only
    const bare = Math.max(1, Math.floor(g.ashore / 3)) * Math.max(0, 3 - radioPen(g, p));
    const def = alive[0]?.def ?? 1;
    const res = tableD(bare - def, die);
    say(g, "sc", `Table D ${proviso()} (sans les armes), écart ${bare - def}, dé ${die} : ${res === "si" ? "oui" : res === "dash" ? "rien" : "non"}.`);
    if (res === "si" && alive[0]) {
      alive[0].alive = false;
      const gain = net(race?.capture ?? 0, ship.level);
      p.pending += gain;
      say(g, "sc", `Capturé. ${gain} points si un équipage complet rembarque.`);
    } else if (res === "no") {
      say(g, "sc", "Ils rompent la capture et frappent. Vous ne répondez pas ce tour.");
      alienStrike(g, p, g.ashore > 0 ? "one-crew" : "ship");
    }
    if (!sunkSince(g, seq0)) finishStay(g);
    return;
  }

  if (ph.tag === "alliance") {
    const fall = race?.fall ?? 1;
    const res = tableE(fall, die, g.persona, g.sector === "externe");
    p.allianceTries += 1;
    say(g, "sc", `Table E ${proviso()}, F. alliance ${fall}, dé ${die}${g.sector === "externe" ? ` moins personnalité ${g.persona}` : ""} : ${res === "si" ? "oui" : res === "dash" ? "rien" : "non"}.`);
    if (res === "si") {
      const gain = net(race?.alliance ?? 0, ship.level);
      p.pending += gain;
      say(g, "sc", `Alliance scellée. ${gain} points au rembarquement d'un équipage complet.`);
    } else if (res === "no") {
      if (p.allianceTries >= 2) p.allianceLocked = true;
      say(g, "sc", "Ils en ont assez. Ils frappent. Vous ne répondez pas avant le tour prochain.");
      alienStrike(g, p, "all-crews");
      if (p.allianceTries >= 2) say(g, "sc", "Deux échecs. L'alliance est fermée.");
    } else if (p.allianceTries >= 2) {
      p.allianceLocked = true;
      say(g, "sc", "Deux essais sans oui. On n'y revient plus.");
    }
    if (!sunkSince(g, seq0)) finishStay(g);
    return;
  }

  if (ph.tag === "intim") {
    const alive = living(p);
    const att = g.ashore > 0 ? crewLines(g, p.kingdom, Math.max(1, Math.floor(g.ashore / 3))).reduce((s, l) => s + l.att, 0) : g.fit.lasers * 6;
    const def = alive.reduce((s, b) => s + b.def, 0) || 1;
    const res = tableA(att - def, die);
    const mapped = res === "U" ? "si" : res === "F" ? "dash" : "no";
    let outcome = mapped;
    if (outcome === "no" && p.suffered && hostileNow(p)) outcome = "dash";
    say(g, "sc", `Table F ${proviso()}, combat théorique, écart ${att - def} : ${outcome === "si" ? "oui" : outcome === "dash" ? "rien" : "non"}.`);
    if (outcome === "si") {
      g.phase = {
        t: "roll",
        faces: 6,
        tag: "venerate",
        blurb: "Ils plient. Lancez pour la vénération.",
        n: 0,
        crews: 0,
        dieNote: "",
      };
      return;
    }
    if (outcome === "no") {
      p.angered = true;
      say(g, "sc", "Ils ne sont pas impressionnés. Ils contre-attaquent pour de vrai.");
      alienStrike(g, p, g.ashore > 0 ? "all-crews" : "ship");
    }
    if (!sunkSince(g, seq0)) finishStay(g);
    return;
  }

  if (ph.tag === "venerate") {
    const pts = tableG(die, g.persona, g.sector === "externe");
    const gain = net(pts, ship.level);
    p.pending += gain;
    say(g, "sc", `Table G ${proviso()} : ${pts} avant niveau, soit ${gain}. Au rembarquement, si l'équipage est complet.`);
    finishStay(g);
    return;
  }

  if (ph.tag === "trade") {
    p.tradeTurns += 1;
    const v = die;
    if (v <= 2) {
      const gain = net(v + 2, ship.level);
      p.pending += gain;
      say(g, "sc", `Table H ${proviso()} : vous gagnez ${gain} points au rembarquement.`);
    } else if (v <= 4) say(g, "sc", `Table H ${proviso()} : marché nul.`);
    else {
      const dmg = v - 4;
      say(g, "sc", `Table H ${proviso()} : leur négoce vous coûte ${dmg} dégât${dmg > 1 ? "s" : ""}.`);
      say(g, "sc", applyC(g, dmg));
    }
    if (!sunkSince(g, seq0)) finishStay(g);
    return;
  }

  if (ph.tag === "nuke") {
    if (die >= 5) {
      g.fit.nukes = Math.max(0, g.fit.nukes - 1);
      p.barred = true;
      p.beings = [];
      say(g, "sc", `Table L ${proviso()}, colonne 3 : le monde est rayé de la tabula. Plus rien à y prendre.`);
      note(g, "monde rayé");
      g.onPlanet = null;
      g.ashore = 0;
    } else {
      say(g, "sc", `Table L ${proviso()} : les scrupules tiennent. La bombe reste en soute.`);
    }
    finishStay(g);
  }
}

function weaponOf(l: { att: number; def: number }) {
  return 0;
}

function grantElim(g: Game, p: Planet, lasers: boolean, die: number) {
  const race = p.raceId ? raceById(p.raceId) : undefined;
  if (!race || !race.elim || p.elimPaid) return;
  if (!p.hadCrew && g.ashore <= 0) {
    say(g, "sc", "Le feu de bord ne paie rien tant qu'un équipage n'a pas foulé le sol.");
    return;
  }
  if (race.laserNullEven && lasers && die % 2 === 0) {
    p.elimPaid = true;
    p.pending += 0;
    say(g, "sc", "Laser et dé pair : la sève a brûlé. Zéro point.");
    return;
  }
  const gain = net(race.elim, shipOf(g).level);
  p.pending += gain;
  p.elimPaid = true;
  say(g, "sc", `Élimination : ${gain} points si un équipage complet rembarque. Tuer davantage ne paie pas deux fois.`);
}

function deployMen(g: Game, crews: number) {
  const p = planetById(g, g.onPlanet);
  const free = g.men - g.ashore;
  const can = Math.min(crews, g.fit.crews, Math.floor(free / 3));
  if (can <= 0) return 0;
  if (g.sector === "externe" && p && (p.band === "sapiens" || ["sub", "civiles", "super"].includes(raceById(p.raceId ?? "")?.klass ?? ""))) {
    if (raceById(p.raceId ?? "")?.klass === "civiles") {
      const die = d6();
      const over = die + g.persona - 7;
      say(g, "sc", `Désertion, dé ${die} plus personnalité ${g.persona}.`);
      if (over > 0) {
        menDie(g, over, "ship");
        say(g, "sc", `${over} homme${over > 1 ? "s" : ""} passe${over > 1 ? "nt" : ""} à l'ennemi avant même la rampe.`);
      } else say(g, "sc", "Personne ne lâche le rang.");
    }
  }
  const free2 = g.men - g.ashore;
  const can2 = Math.min(crews, g.fit.crews, Math.floor(free2 / 3));
  g.ashore += can2 * 3;
  if (p && can2 > 0) p.hadCrew = true;
  g.shieldsUp = false;
  return can2;
}

export function apply(prev: Game, act: Act): Game {
  const g = structuredClone(prev) as Game;
  const seq0 = g.seq;
  const ship = shipOf(g);

  if (act.t === "abandon") {
    return newGame(g.sector);
  }

  if (act.t === "officer" && g.phase.t === "officer") {
    const name = act.name.trim().slice(0, 32);
    if (!name) return g;
    g.officer = name;
    say(g, "uc", name);
    say(g, "sc", `${name}. Grade de départ : Decurio. Nef : Frombola, niveau 0. Nommez la nef.`);
    g.phase = { t: "ship" };
    return g;
  }

  if (act.t === "ship" && g.phase.t === "ship") {
    const name = act.name.trim().slice(0, 24);
    if (!name) return g;
    g.shipName = name;
    say(g, "uc", name);
    say(
      g,
      "sc",
      `${name}. Dix postes. Minimum un équipage, deux radars au plus, trois réservoirs au plus, cinq parsecs chacun. Composez la fiche. On ne la changera plus en vol.`,
    );
    g.phase = { t: "fit" };
    return g;
  }

  if (act.t === "fit" && (g.phase.t === "fit" || g.phase.t === "refit")) {
    const err = fitError(shipOf(g), act.fit);
    if (err) {
      say(g, "sc", err);
      return g;
    }
    g.fit = { ...act.fit };
    g.men = act.fit.crews * 3;
    g.ashore = 0;
    if (g.phase.t === "fit") {
      say(g, "uc", ficheLine(act.fit));
      if (g.sector === "externe") {
        say(g, "sc", "L'externe juge aussi votre caractère. Zéro : diplomate. Cinq : vous cherchez le sang. Choisissez. Ce chiffre ne bougera plus.");
        g.phase = { t: "persona" };
      } else {
        launch(g);
      }
    } else {
      say(g, "sc", `Droidi au travail. ${ficheLine(act.fit)} Les postes détruits sont remplacés. Cela ne coûte pas de tour.`);
      note(g, "refonte au bassin");
      g.phase = { t: "play" };
    }
    return g;
  }

  if (act.t === "persona" && g.phase.t === "persona") {
    g.persona = Math.max(0, Math.min(5, act.n));
    say(g, "uc", `Personnalité ${g.persona}.`);
    launch(g);
    return g;
  }

  if (act.t === "rescue") {
    wreck(g, "Vous demandez la porte de sauvetage.");
    return g;
  }

  if (act.t === "open-refit") {
    const p = planetById(g, g.onPlanet);
    if (!p?.base) {
      say(g, "sc", "Les droidi ne travaillent qu'à la base.");
      return g;
    }
    g.phase = { t: "refit" };
    return g;
  }

  if (act.t === "promote") {
    const p = planetById(g, g.onPlanet);
    if (!p?.base) return g;
    if (g.points < ship.promo) {
      say(g, "sc", `Le missus refuse. Il faut ${ship.promo} points. Vous en avez ${g.points}.`);
      return g;
    }
    if (ship.id === "hasta") {
      g.rank = "fabius";
      g.phase = { t: "end" };
      say(g, "sc", `${g.officer}, le Sénat vous nomme Fabius, commandant de la Legio. La partie est à vous.`);
      note(g, "FABIUS");
      return g;
    }
    const idx = SHIPS.findIndex((s) => s.id === ship.id);
    const next = SHIPS[idx + 1];
    g.points = 0;
    g.shipId = next.id;
    g.rank = next.rank;
    g.fit = starterFit(next);
    g.men = g.fit.crews * 3;
    g.turn = 1;
    say(
      g,
      "sc",
      `Le missus vous élève ${RANK_LABEL[next.rank]}. Nef ${next.name}, niveau ${next.level}. Points remis à zéro. La fiche que je vous tends est un départ : vous pouvez la refaire avant de partir.`,
    );
    note(g, `promotion ${RANK_LABEL[next.rank]} — ${next.name}`);
    g.phase = { t: "refit" };
    return g;
  }

  if (g.phase.t === "end") return g;

  if (act.t === "open-route" && g.phase.t === "play") {
    if (g.ashore > 0) {
      say(g, "sc", "Rembarquez d'abord.");
      return g;
    }
    g.phase = { t: "route", segs: [], landing: false };
    say(g, "sc", `Réservoirs : ${g.fit.tanks} × ${ship.thrust} = ${g.fit.tanks * ship.thrust} parsecs. Haut et bas coûtent 4, d'un bloc.`);
    return g;
  }

  if (g.phase.t === "route") {
    if (act.t === "cancel-route") {
      g.phase = { t: "play" };
      return g;
    }
    if (act.t === "pop-seg") {
      g.phase.segs.pop();
      return g;
    }
    if (act.t === "land-flag") {
      g.phase.landing = !g.phase.landing;
      return g;
    }
    if (act.t === "add-seg") {
      const left = g.fit.tanks * ship.thrust - routeCost(g.phase.segs);
      if (act.dir === "HAUT" || act.dir === "BAS") {
        if (left < 4) {
          say(g, "sc", "Plus assez de poussée pour changer de niveau.");
          return g;
        }
        g.phase.segs.push({ dir: act.dir, n: 4 });
      } else {
        const n = Math.max(1, Math.min(act.n, left));
        if (n < 1 || left < 1) {
          say(g, "sc", "Plus de poussée.");
          return g;
        }
        g.phase.segs.push({ dir: act.dir, n });
      }
      return g;
    }
    if (act.t === "send-route") {
      const segs = g.phase.segs;
      const landing = g.phase.landing;
      g.phase = { t: "play" };
      fly(g, segs, landing);
      return g;
    }
  }

  if (act.t === "observe" && g.phase.t === "play") {
    say(g, "uc", `J'observe. Radars ${g.fit.radars}.`);
    note(g, `observation — radars ${g.fit.radars}`);
    scanFrom(g, g.level, g.x, g.y, "Depuis votre position,");
    g.infoLeft = g.fit.computers;
    const opts = contacts(g);
    if (g.infoLeft > 0 && opts.length) {
      say(g, "sc", `${g.infoLeft} Mater en ligne.`);
      g.phase = { t: "info", options: opts };
    } else {
      say(g, "sc", g.fit.radars ? "Rien dans le rayon, ou plus rien à traduire." : "Sans radar, l'espace est un mur.");
      g.turn += 1;
    }
    return g;
  }

  if (act.t === "open-info" && g.phase.t === "play") {
    g.infoLeft = g.fit.computers;
    const opts = contacts(g);
    if (!opts.length || g.infoLeft <= 0) {
      say(g, "sc", "Pas de Mater, ou rien à portée.");
      return g;
    }
    g.phase = { t: "info", options: opts };
    return g;
  }

  if (g.phase.t === "info") {
    if (act.t === "close-info") {
      g.turn += 1;
      g.phase = { t: "play" };
      say(g, "sc", "Dossier suspendu. À vous le tour suivant.");
      return g;
    }
    if (act.t === "spend") {
      if (g.infoLeft <= 0) {
        say(g, "sc", "Plus de Mater ce tour.");
        return g;
      }
      const p = planetById(g, act.id);
      if (!p) return g;
      g.infoLeft -= 1;
      const line = advance(g, p);
      say(g, "uc", "Une information.");
      say(g, "sc", line);
      if (g.infoLeft <= 0) {
        g.turn += 1;
        g.phase = { t: "play" };
        say(g, "sc", "Mater au repos.");
      } else {
        g.phase = { t: "info", options: contacts(g) };
      }
      return g;
    }
  }

  if (g.phase.t === "attitude" && act.t === "attitude") {
    const p = planetById(g, g.onPlanet);
    if (!p) return g;
    say(g, "uc", attitudeLine(act.k, act.crews));
    const revealed = dumpRest(g, p);
    say(g, "sc", revealed);
    if (!p.presenceRolled) presence(g, p);
    const race = p.raceId ? raceById(p.raceId) : undefined;
    if (race?.missions.includes("collect")) {
      if (act.k === "C" || act.k === "D") {
        const n = deployMen(g, Math.max(1, act.crews));
        if (n > 0 && !p.collected) {
          p.collected = true;
          const gain = net(race.elim, ship.level);
          p.pending += gain;
          say(g, "sc", `Cueillette. ${gain} points si l'équipage rembarque entier.`);
        }
      } else say(g, "sc", "Pour cueillir, il faut descendre. Boucliers levés, rien ne se ramasse.");
      finishStay(g);
      return g;
    }
    if (act.k === "A") {
      g.shieldsUp = true;
      g.ashore = 0;
      if (hostileNow(p)) alienStrike(g, p, "ship");
      else say(g, "sc", "Boucliers levés. Ils ne bougent pas.");
      if (!sunkSince(g, seq0)) finishStay(g);
      return g;
    }
    if (act.k === "B") {
      g.shieldsUp = true;
      if (g.fit.lasers <= 0) {
        say(g, "sc", "Vous n'avez pas de laser de bord. Je vous laisse les boucliers levés.");
        if (hostileNow(p)) alienStrike(g, p, "ship");
        if (!sunkSince(g, seq0)) finishStay(g);
        return g;
      }
      const max = Math.max(1, living(p).length);
      g.phase = { t: "focus", mode: "lasers", crews: 0 };
      if (max <= 1) beginClash(g, "lasers", 0, 1);
      return g;
    }
    const n = deployMen(g, act.crews);
    if (n <= 0) {
      say(g, "sc", "Pas un équipage complet à descendre. La rampe se referme.");
      g.shieldsUp = false;
      if (hostileNow(p)) alienStrike(g, p, "ship");
      if (!sunkSince(g, seq0)) finishStay(g);
      return g;
    }
    say(g, "sc", `${n} équipage${n > 1 ? "s" : ""} au sol.`);
    if (act.k === "D") {
      const max = Math.max(1, living(p).length);
      g.phase = { t: "focus", mode: "crews", crews: n };
      if (max <= 1) beginClash(g, "crews", n, 1);
      return g;
    }
    if (hostileNow(p)) {
      say(g, "sc", "Vous descendez sans tirer. Eux frappent d'abord.");
      alienStrike(g, p, "all-crews");
    }
    if (sunkSince(g, seq0)) return g;
    if (g.ashore >= 3) {
      say(g, "sc", "Quelle mission ? Une seule, hors le feu qui reste toujours un recours.");
      g.phase = { t: "mission" };
    } else if (!sunkSince(g, seq0)) finishStay(g);
    return g;
  }

  if (g.phase.t === "focus" && act.t === "focus") {
    beginClash(g, g.phase.mode, g.phase.crews, act.n);
    return g;
  }

  if (g.phase.t === "roll" && act.t === "roll") {
    const die = g.phase.faces === 10 ? d10() : d6();
    resolveRoll(g, die);
    return g;
  }

  if (act.t === "hold" && g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    if (!p || p.base) return g;
    g.shieldsUp = true;
    say(g, "uc", "Boucliers levés. Je tiens.");
    if (hostileNow(p) && g.ashore <= 0) alienStrike(g, p, "ship");
    else if (hostileNow(p) && g.ashore > 0) {
      say(g, "sc", "Les boucliers ne se lèvent pas tant que les hommes sont dehors. Ils vous prennent au sol.");
      g.shieldsUp = false;
      alienStrike(g, p, "all-crews");
    } else say(g, "sc", "Rien ne bouge.");
    if (!sunkSince(g, seq0)) finishStay(g);
    return g;
  }

  if (act.t === "lasers" && g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    if (!p || p.base) return g;
    if (g.ashore > 0) {
      say(g, "sc", "Les lasers de bord cherchent tout seuls. Pas tant qu'un homme est dehors.");
      return g;
    }
    if (g.fit.lasers <= 0) {
      say(g, "sc", "Plus de laser de bord.");
      return g;
    }
    g.shieldsUp = true;
    const max = living(p).length;
    if (max <= 0) {
      say(g, "sc", "Le sol est vide.");
      return g;
    }
    g.phase = { t: "focus", mode: "lasers", crews: 0 };
    if (max === 1) beginClash(g, "lasers", 0, 1);
    return g;
  }

  if (act.t === "deploy" && g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    if (!p || p.base) return g;
    if (p.barred) return g;
    if (g.shieldsUp) {
      say(g, "sc", "Coupez les boucliers. La rampe ne s'ouvre pas dedans — et ce tour, ils sont comme vous les avez laissés. Reprenez au tour suivant, boucliers déjà bas.");
      return g;
    }
    const n = deployMen(g, act.crews);
    if (n <= 0) {
      say(g, "sc", "Pas d'équipage complet disponible.");
      return g;
    }
    say(g, "uc", `${n} équipage${n > 1 ? "s" : ""} au sol${act.fight ? ", et qu'ils tirent" : ", sans tirer"}.`);
    if (act.fight) {
      g.phase = { t: "focus", mode: "crews", crews: n };
      if (living(p).length <= 1) beginClash(g, "crews", n, Math.max(1, living(p).length));
      return g;
    }
    if (hostileNow(p)) alienStrike(g, p, "all-crews");
    if (sunkSince(g, seq0)) return g;
    if (g.ashore >= 3) {
      g.phase = { t: "mission" };
      say(g, "sc", "Quelle mission ?");
    } else finishStay(g);
    return g;
  }

  if (g.phase.t === "mission" && act.t === "mission") {
    const p = planetById(g, g.onPlanet);
    const race = p?.raceId ? raceById(p.raceId) : undefined;
    if (!p || !race) {
      g.phase = { t: "play" };
      return g;
    }
    if (g.ashore < 3) {
      say(g, "sc", "Il faut un équipage complet au sol.");
      finishStay(g);
      return g;
    }
    if (act.k === "elim") {
      g.phase = { t: "focus", mode: "crews", crews: Math.floor(g.ashore / 3) };
      if (living(p).length <= 1) beginClash(g, "crews", Math.floor(g.ashore / 3), Math.max(1, living(p).length));
      return g;
    }
    if (!race.missions.includes(act.k)) {
      say(g, "sc", "Cette mission n'est pas ouverte ici.");
      return g;
    }
    if (p.fired && (act.k === "alliance" || act.k === "intim" || act.k === "trade")) {
      say(g, "sc", "Vous avez déjà tiré. Il reste le feu, pas la main tendue.");
      return g;
    }
    if (act.k === "capture") {
      if (hostileNow(p) && !p.suffered) {
        say(g, "sc", "Hostiles : encaissez d'abord un assaut, puis tentez la capture.");
        return g;
      }
      g.phase = { t: "roll", faces: 6, tag: "capture", blurb: "Capture. Les armes individuelles ne comptent pas. Lancez.", n: 0, crews: 0, dieNote: "" };
      return g;
    }
    if (act.k === "alliance") {
      if (p.allianceLocked) {
        say(g, "sc", "Alliance fermée.");
        finishStay(g);
        return g;
      }
      g.phase = { t: "roll", faces: 6, tag: "alliance", blurb: "Vous tendez la main. Lancez.", n: 0, crews: 0, dieNote: "" };
      return g;
    }
    if (act.k === "intim") {
      g.phase = { t: "roll", faces: 6, tag: "intim", blurb: "Démonstration, sans consequence pour eux — encore. Lancez.", n: 0, crews: 0, dieNote: "" };
      return g;
    }
    if (act.k === "trade") {
      if (p.tradeTurns >= 2) {
        say(g, "sc", "Deux tours de troc, pas trois.");
        finishStay(g);
        return g;
      }
      g.phase = { t: "roll", faces: 6, tag: "trade", blurb: "Le marché s'ouvre. Lancez.", n: 0, crews: 0, dieNote: "" };
      return g;
    }
    if (act.k === "collect" && !p.collected) {
      p.collected = true;
      const gain = net(race.elim, ship.level);
      p.pending += gain;
      say(g, "sc", `Cueillette. ${gain} points au retour d'un équipage complet.`);
      finishStay(g);
      return g;
    }
    finishStay(g);
    return g;
  }

  if (act.t === "nuke" && g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    if (!p || p.base || !ship.nuke || g.fit.nukes <= 0) {
      say(g, "sc", "Pas de Tot en soute, ou pas de monde sous la nef.");
      return g;
    }
    if (g.ashore > 0) {
      say(g, "sc", "Personne ne lâche le Tot avec des hommes sur la rampe.");
      return g;
    }
    say(g, "uc", "Lancement du Tot.");
    g.phase = {
      t: "roll",
      faces: 6,
      tag: "nuke",
      blurb: "Table L. Cinq ou six rayent le monde. En dessous, la bombe reste en soute. Lancez.",
      n: 0,
      crews: 0,
      dieNote: "",
    };
    return g;
  }

  if (act.t === "reembark" && g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    if (!p || p.base) return g;
    if (g.ashore <= 0 && !p.hadCrew) {
      say(g, "sc", "Personne dehors. Décoller est une route.");
      return g;
    }
    g.shieldsUp = false;
    say(g, "uc", "On rembarque.");
    if (living(p).length && (hostileNow(p) || p.angered)) {
      say(g, "sc", "Ils vous prennent pendant la rampe.");
      alienStrike(g, p, g.ashore > 0 ? "all-crews" : "ship");
    }
    if (sunkSince(g, seq0)) return g;
    const brought = g.ashore;
    g.ashore = 0;
    if (p.hadCrew && brought >= 3) {
      /* cash happens when leaving the square via route; keep pending */
      say(g, "sc", "Rembarqué. Déclarez la route de décollage. Les points se comptent quand vous quittez le sol.");
    } else if (p.hadCrew) {
      say(g, "sc", "Pas un équipage de trois à la rampe. Si vous décollez, la mission ne paie pas.");
    }
    g.phase = { t: "route", segs: [], landing: false };
    return g;
  }

  if (act.t === "mission" && g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    if (!p || g.ashore < 3) {
      say(g, "sc", "Descendez d'abord un équipage complet.");
      return g;
    }
    g.phase = { t: "mission" };
    return apply(g, act);
  }

  return g;
}

function gsufferedUnused() {
  return ensureSuffered;
}

function launch(g: Game) {
  g.infoLeft = g.fit.computers;
  g.phase = { t: "play" };
  say(
    g,
    "sc",
    `${RANK_LABEL[g.rank]} ${g.officer}, la ${shipOf(g).name} ${g.shipName} est armée. Vous êtes sur la base. Où elle se trouve dans le secteur, vous ne le savez pas. Tour ${g.turn}. Déclarez une route — ou observez.`,
  );
  note(g, `départ ${g.shipName} — ${ficheLine(g.fit)}`);
}

function attitudeLine(k: "A" | "B" | "C" | "D", crews: number) {
  if (k === "A") return "Atterrissage, boucliers levés, pas de feu.";
  if (k === "B") return "Atterrissage, boucliers levés, lasers de bord.";
  if (k === "C") return `Atterrissage, boucliers baissés, ${crews} équipage${crews > 1 ? "s" : ""} sans tirer.`;
  return `Atterrissage, boucliers baissés, ${crews} équipage${crews > 1 ? "s" : ""} au feu.`;
}

export function ficheLine(f: Fit): string {
  return `Équipages ${f.crews}, boucliers ${f.shields}, lasers ${f.lasers}, radars ${f.radars}, Mater ${f.computers}, réservoirs ${f.tanks}, modules ${f.modules} (Zip ${f.zip}, HO ${f.ho}, Sil ${f.sil}), bombes ${f.nukes}.`;
}

export function menLabel(g: Game): string {
  const full = Math.floor(g.men / 3);
  const rest = g.men % 3;
  if (rest === 0) return `${full} équipage${full > 1 ? "s" : ""}`;
  return `${full} + ${rest}`;
}

export function dock(g: Game): DockItem[] {
  if (g.phase.t === "end") return [{ label: "Nouvelle mission", act: { t: "abandon" }, tone: "gold" }];
  if (g.phase.t === "persona") {
    return [0, 1, 2, 3, 4, 5].map((n) => ({ label: String(n), act: { t: "persona", n }, tone: "gold" as const }));
  }
  if (g.phase.t === "play") {
    const p = planetById(g, g.onPlanet);
    const items: DockItem[] = [];
    if (p?.base) {
      items.push({ label: "Composer une route", act: { t: "open-route" }, tone: "gold" });
      items.push({ label: "Refaire la fiche", act: { t: "open-refit" }, tone: "ghost" });
      if (g.points >= shipOf(g).promo) items.push({ label: "Demander la promotion", act: { t: "promote" }, tone: "gold" });
    } else if (p && !p.base) {
      const race = p.raceId ? raceById(p.raceId) : undefined;
      if (g.ashore <= 0) {
        items.push({ label: "Tenir, boucliers levés", act: { t: "hold" }, tone: "ghost" });
        if (g.fit.lasers > 0) items.push({ label: "Feu des lasers", act: { t: "lasers" }, tone: "seal" });
        const can = Math.min(g.fit.crews, Math.floor(g.men / 3));
        if (can > 0 && !g.shieldsUp) {
          items.push({ label: `Descendre ${can > 1 ? "des équipages" : "un équipage"}, sans tirer`, act: { t: "deploy", crews: can, fight: false }, tone: "gold" });
          items.push({ label: "Descendre et tirer", act: { t: "deploy", crews: can, fight: true }, tone: "seal" });
        }
      } else {
        items.push({ label: "Tir des équipages", act: { t: "mission", k: "elim" }, tone: "seal" });
        if (race) {
          for (const m of race.missions) {
            if (m === "elim" || m === "collect") continue;
            const label =
              m === "capture" ? "Tenter la capture" : m === "alliance" ? "Proposer l'alliance" : m === "intim" ? "Intimider" : "Commercer";
            items.push({ label, act: { t: "mission", k: m }, tone: "gold" });
          }
          if (race.missions.includes("collect") && !p.collected)
            items.push({ label: "Cueillir", act: { t: "mission", k: "collect" }, tone: "gold" });
        }
        items.push({ label: "Rembarquer et décoller", act: { t: "reembark" }, tone: "ghost" });
      }
      if (g.fit.nukes > 0 && shipOf(g).nuke && g.ashore <= 0)
        items.push({ label: "Lancer le Tot", act: { t: "nuke" }, tone: "seal" });
    } else {
      items.push({ label: "Composer une route", act: { t: "open-route" }, tone: "gold" });
      items.push({ label: "Observer sans bouger", act: { t: "observe" }, tone: "ghost" });
      if (g.fit.computers > 0 && contacts(g).length)
        items.push({ label: "Demander une information", act: { t: "open-info" }, tone: "gold" });
    }
    items.push({ label: "Porte de sauvetage", act: { t: "rescue" }, tone: "seal" });
    return items;
  }
  if (g.phase.t === "info") {
    const items: DockItem[] = g.phase.options.map((o) => ({
      label: o.label,
      act: { t: "spend", id: o.id },
      tone: "gold" as const,
    }));
    items.push({ label: "Assez", act: { t: "close-info" }, tone: "ghost" });
    return items;
  }
  if (g.phase.t === "attitude") {
    const can = Math.min(g.fit.crews, Math.floor(g.men / 3));
    return [
      { label: "Boucliers, pas de feu", act: { t: "attitude", k: "A", crews: 0 }, tone: "ghost" },
      { label: "Boucliers et lasers", act: { t: "attitude", k: "B", crews: 0 }, tone: "seal" },
      ...(can > 0
        ? ([
            { label: `Descendre ${can}, sans tirer`, act: { t: "attitude", k: "C", crews: can }, tone: "gold" },
            { label: `Descendre ${can} et tirer`, act: { t: "attitude", k: "D", crews: can }, tone: "seal" },
          ] as DockItem[])
        : []),
    ];
  }
  if (g.phase.t === "focus") {
    const p = planetById(g, g.onPlanet);
    const n = Math.max(1, living(p!).length);
    const items: DockItem[] = [{ label: "Sur un seul", act: { t: "focus", n: 1 }, tone: "gold" }];
    if (n > 1) items.push({ label: `Sur tous (${n})`, act: { t: "focus", n }, tone: "seal" });
    return items;
  }
  if (g.phase.t === "roll") return [{ label: "Lancer le dé", act: { t: "roll" }, tone: "gold" }];
  if (g.phase.t === "mission") {
    const p = planetById(g, g.onPlanet);
    const race = p?.raceId ? raceById(p.raceId) : undefined;
    const items: DockItem[] = [{ label: "Ouvrir le feu", act: { t: "mission", k: "elim" }, tone: "seal" }];
    if (race) {
      for (const m of race.missions) {
        if (m === "elim") continue;
        const label =
          m === "capture" ? "Capture" : m === "alliance" ? "Alliance" : m === "intim" ? "Intimidation" : m === "trade" ? "Troc" : "Cueillette";
        items.push({ label, act: { t: "mission", k: m }, tone: "gold" });
      }
    }
    return items;
  }
  return [];
}

export function focusCount(g: Game): number {
  if (g.phase.t !== "focus" || !g.onPlanet) return 1;
  const p = planetById(g, g.onPlanet);
  return Math.max(1, p ? living(p).length : 1);
}

void gSuffered;
void weaponOf;
void gsufferedUnused;
