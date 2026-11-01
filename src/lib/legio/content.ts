/** VII Legio — données de jeu.
 *  Sources : règlement U.C., règlement S.C., scheda d'allestimento, guida incontri.
 *  Les tableaux A–L imprimés ne figurent pas dans les livrets narratifs : les grilles
 *  marquées PROVISOIRE sont une reconstruction monotone, calibrée sur l'exemple
 *  (dé 6 + écart faible ou négatif → F ; dé 1, défense 3 contre attaque 5 → 0).
 *  À remplacer dès arbitrage.
 */

export type Dir = "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO" | "HAUT" | "BAS";

export type RankId = "decurio" | "centurio" | "proconsul" | "consul" | "fabius";

export interface ShipClass {
  id: string;
  name: string;
  level: number;
  rank: RankId;
  slots: number;
  minCrews: number;
  maxRadar: number;
  maxTanks: number;
  /** Parsecs par réservoir. Spatha/Hasta : correction de masse, voir ERRATA. */
  thrust: number;
  promo: number;
  nuke: boolean;
}

export const SHIPS: ShipClass[] = [
  { id: "frombola", name: "FROMBOLA", level: 0, rank: "decurio", slots: 10, minCrews: 1, maxRadar: 2, maxTanks: 3, thrust: 5, promo: 6, nuke: false },
  { id: "gladium", name: "GLADIUM", level: 1, rank: "centurio", slots: 16, minCrews: 2, maxRadar: 3, maxTanks: 4, thrust: 4, promo: 6, nuke: false },
  { id: "spatha", name: "SPATHA", level: 2, rank: "proconsul", slots: 19, minCrews: 4, maxRadar: 3, maxTanks: 4, thrust: 3, promo: 7, nuke: true },
  { id: "hasta", name: "HASTA", level: 3, rank: "consul", slots: 21, minCrews: 6, maxRadar: 3, maxTanks: 5, thrust: 2, promo: 8, nuke: true },
];

export const RANK_LABEL: Record<RankId, string> = {
  decurio: "Decurio",
  centurio: "Centurio",
  proconsul: "Proconsul",
  consul: "Consul",
  fabius: "Fabius",
};

export const DIR_LABEL: Record<Dir, string> = {
  N: "Nord",
  NE: "Nord-Est",
  E: "Est",
  SE: "Sud-Est",
  S: "Sud",
  SO: "Sud-Ouest",
  O: "Ouest",
  NO: "Nord-Ouest",
  HAUT: "Haut",
  BAS: "Bas",
};

export interface Fit {
  crews: number;
  shields: number;
  lasers: number;
  radars: number;
  computers: number;
  tanks: number;
  modules: number;
  zip: number;
  ho: number;
  sil: number;
  nukes: number;
}

export const EMPTY_FIT: Fit = {
  crews: 1, shields: 1, lasers: 1, radars: 2, computers: 1, tanks: 3,
  modules: 0, zip: 0, ho: 0, sil: 0, nukes: 0,
};

export type MissionId = "elim" | "capture" | "alliance" | "intim" | "trade" | "collect";

export interface Race {
  id: string;
  name: string;
  kingdom: "animal" | "vegetal" | "mineral";
  /** Sous-famille au niveau IV. */
  klass: "monstra" | "poison" | "sub" | "civiles" | "super" | "oz" | "secor";
  blurb: string;
  /** Nombre, ou miroir du facteur légionnaire. */
  fc: number | "mirror" | "mirror-die";
  temperament: "pacific" | "hostile" | "merchant";
  missions: MissionId[];
  elim: number;
  capture: number;
  fall: number;
  alliance: number;
  /** Index 0 = dé 1. */
  presence: number[];
  arrivals: number[];
  poison: boolean;
  /** N'endommage pas une nef posée (Sevolventes). */
  shipsImmune: boolean;
  /** Élimination au laser : 0 point si le dé est pair. */
  laserNullEven: boolean;
  pref: string;
  prefBonus: number;
  nonvital: string;
  tech: number | null;
  note: string;
}

export const RACES: Race[] = [
  {
    id: "sevolventes",
    name: "SEVOLVENTES",
    kingdom: "vegetal",
    klass: "monstra",
    blurb: "Troncs roulants, un mètre sur dix. Un noyau interne les fait avancer. Ils écrasent les équipages au sol. Une nef posée ne craint rien d'eux.",
    fc: 2,
    temperament: "pacific",
    missions: ["elim"],
    elim: 5,
    capture: 0,
    fall: 0,
    alliance: 0,
    presence: [2, 2, 4, 4, 6, 6],
    arrivals: [1, 1, 3, 3, 3, 5],
    poison: false,
    shipsImmune: true,
    laserNullEven: false,
    pref: "glace",
    prefBonus: 1,
    nonvital: "forêt, eau",
    tech: null,
    note: "La guida donne F.C. 2. L'exemple imprimé dit 5 — voir le codex.",
  },
  {
    id: "radicales",
    name: "RADICALES",
    kingdom: "vegetal",
    klass: "poison",
    blurb: "Un tubercule enterré, des tentacules épineux dans l'herbe haute ou la boue. La sève est un lubrifiant recherché. Le laser la fait évaporer.",
    fc: 10,
    temperament: "hostile",
    missions: ["elim", "capture"],
    elim: 5,
    capture: 15,
    fall: 0,
    alliance: 0,
    presence: [1, 1, 1, 1, 2, 2],
    arrivals: [0, 0, 0, 0, 0, 0],
    poison: true,
    shipsImmune: false,
    laserNullEven: true,
    pref: "forêt, marais",
    prefBonus: 8,
    nonvital: "désert, glace",
    tech: null,
    note: "Poison : les pertes d'hommes sont doublées. Laser et dé pair : zéro point.",
  },
  {
    id: "liana",
    name: "LIANA NIGRA",
    kingdom: "vegetal",
    klass: "poison",
    blurb: "Lianes noires, lentes, qui referment un piège sur qui s'attarde au sol.",
    fc: 6,
    temperament: "hostile",
    missions: ["elim", "capture"],
    elim: 4,
    capture: 8,
    fall: 0,
    alliance: 0,
    presence: [1, 1, 2, 2, 3, 4],
    arrivals: [0, 0, 1, 1, 1, 2],
    poison: true,
    shipsImmune: false,
    laserNullEven: false,
    pref: "forêt",
    prefBonus: 2,
    nonvital: "glace",
    tech: null,
    note: "Poison.",
  },
  {
    id: "upomedi",
    name: "UPOMEDI",
    kingdom: "vegetal",
    klass: "sub",
    blurb: "Nomades végétaux chassés d'Andromède, trop frustes pour une cité, assez rusés pour tenir un comptoir.",
    fc: 2,
    temperament: "merchant",
    missions: ["intim", "trade"],
    elim: 0,
    capture: 0,
    fall: 0,
    alliance: 0,
    presence: [4, 4, 4, 8, 8, 8],
    arrivals: [0, 0, 0, 4, 4, 4],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "glace, désert",
    prefBonus: 1,
    nonvital: "forêt",
    tech: null,
    note: "Marchands. Deux tours de troc au plus.",
  },
  {
    id: "troncidi",
    name: "TRONCIDI",
    kingdom: "vegetal",
    klass: "civiles",
    blurb: "Troncs marchant, empire semi-féodal. Ils traitent, ils s'allient, ils ne se laissent pas bousculer.",
    fc: 12,
    temperament: "pacific",
    missions: ["alliance", "trade"],
    elim: 0,
    capture: 0,
    fall: 2,
    alliance: 6,
    presence: [1, 1, 1, 1, 2, 3],
    arrivals: [0, 0, 0, 0, 1, 1],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "pyramide",
    prefBonus: 4,
    nonvital: "eau, glace",
    tech: 7,
    note: "F. alliance 2, valeur 6.",
  },
  {
    id: "ipnotici",
    name: "IPNOTICI",
    kingdom: "vegetal",
    klass: "civiles",
    blurb: "Leur renommée les précède. Le regard fixe double les pertes : sur la table B, 1 et 2 comptent 2, 3 et 4 comptent 4.",
    fc: 5,
    temperament: "pacific",
    missions: ["elim", "alliance", "trade"],
    elim: 4,
    capture: 0,
    fall: 2,
    alliance: 8,
    presence: [1, 2, 2, 2, 3, 4],
    arrivals: [0, 0, 0, 1, 3, 3],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "village",
    prefBonus: 2,
    nonvital: "glace",
    tech: null,
    note: "Table B arrondie au pair supérieur. Désertion possible dans l'externe, parmi les civiles.",
  },
  {
    id: "alghidi",
    name: "ALGHIDI",
    kingdom: "vegetal",
    klass: "civiles",
    blurb: "Peuple des eaux. Pacifiques tant qu'on ne les prend pas pour des proies, et durs à déloger de leur élément.",
    fc: 5,
    temperament: "pacific",
    missions: ["elim", "alliance"],
    elim: 4,
    capture: 0,
    fall: 3,
    alliance: 6,
    presence: [1, 1, 1, 2, 2, 3],
    arrivals: [1, 1, 1, 3, 3, 3],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "eau",
    prefBonus: 2,
    nonvital: "désert",
    tech: null,
    note: "",
  },
  {
    id: "psico",
    name: "PSICO",
    kingdom: "vegetal",
    klass: "super",
    blurb: "Sphères à psicosenseurs, portées par les Cimbriini. Ils protègent une race inférieure et n'aiment pas qu'on les dérange.",
    fc: 15,
    temperament: "pacific",
    missions: ["alliance"],
    elim: 0,
    capture: 0,
    fall: 4,
    alliance: 6,
    presence: [1, 1, 1, 1, 1, 1],
    arrivals: [1, 1, 1, 1, 1, 3],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "village",
    prefBonus: 5,
    nonvital: "désert, glace",
    tech: null,
    note: "F. alliance 4.",
  },
  {
    id: "normo",
    name: "NORMO",
    kingdom: "vegetal",
    klass: "super",
    blurb: "Originaires d'Aleantz. Leur attaque égale votre défense, leur défense égale votre attaque.",
    fc: "mirror",
    temperament: "pacific",
    missions: ["alliance"],
    elim: 0,
    capture: 0,
    fall: 2,
    alliance: 10,
    presence: [1, 1, 1, 1, 1, 2],
    arrivals: [0, 0, 0, 1, 1, 1],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "forêt",
    prefBonus: 5,
    nonvital: "aucun",
    tech: 5,
    note: "Facteurs en miroir.",
  },
  {
    id: "aspis",
    name: "ASPIS",
    kingdom: "animal",
    klass: "poison",
    blurb: "Lézards d'apparence bénigne. Venin sans fond, et une seconde tête qui frappe sous la colonne.",
    fc: 8,
    temperament: "hostile",
    missions: ["elim", "capture"],
    elim: 4,
    capture: 12,
    fall: 0,
    alliance: 0,
    presence: [1, 1, 1, 1, 1, 2],
    arrivals: [0, 0, 0, 0, 1, 1],
    poison: true,
    shipsImmune: false,
    laserNullEven: false,
    pref: "désert",
    prefBonus: 2,
    nonvital: "village",
    tech: null,
    note: "Poison.",
  },
  {
    id: "scorpio",
    name: "SCORPIO",
    kingdom: "animal",
    klass: "poison",
    blurb: "Prédateur du désert, dangereux pour les équipages comme pour une nef qui resterait ouverte.",
    fc: 12,
    temperament: "hostile",
    missions: ["elim", "capture"],
    elim: 6,
    capture: 18,
    fall: 0,
    alliance: 0,
    presence: [1, 1, 1, 1, 2, 3],
    arrivals: [0, 0, 0, 0, 0, 1],
    poison: true,
    shipsImmune: false,
    laserNullEven: false,
    pref: "désert",
    prefBonus: 2,
    nonvital: "glace",
    tech: null,
    note: "Poison.",
  },
  {
    id: "elph",
    name: "ELPH",
    kingdom: "animal",
    klass: "sub",
    blurb: "Petits archers des bois, presque incorporels de branche en branche. Le bas de l'échelle sapiens.",
    fc: 1,
    temperament: "pacific",
    missions: ["intim"],
    elim: 0,
    capture: 0,
    fall: 0,
    alliance: 0,
    presence: [3, 3, 3, 3, 5, 7],
    arrivals: [0, 0, 2, 2, 4, 4],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "forêt",
    prefBonus: 1,
    nonvital: "eau",
    tech: null,
    note: "Intimidation seulement.",
  },
  {
    id: "attlers",
    name: "ATTLERS",
    kingdom: "animal",
    klass: "super",
    blurb: "Mi-hommes, mi-serpents, méditant sur leur queue. Armes psychiques : leur défense égale la vôtre, leur attaque la vôtre plus un dé.",
    fc: "mirror-die",
    temperament: "pacific",
    missions: ["alliance"],
    elim: 0,
    capture: 0,
    fall: 1,
    alliance: 10,
    presence: [1, 1, 1, 1, 1, 1],
    arrivals: [0, 0, 0, 0, 1, 1],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "aucun",
    prefBonus: 0,
    nonvital: "aucun",
    tech: null,
    note: "F. alliance 1, valeur 10.",
  },
  {
    id: "cronos",
    name: "CRONOS",
    kingdom: "animal",
    klass: "super",
    blurb: "Leur attaque égale la vôtre, multipliée par un dé. Leur défense égale la vôtre.",
    fc: "mirror-die",
    temperament: "pacific",
    missions: ["alliance"],
    elim: 0,
    capture: 0,
    fall: 1,
    alliance: 12,
    presence: [1, 1, 1, 1, 1, 1],
    arrivals: [0, 0, 0, 0, 1, 2],
    poison: false,
    shipsImmune: false,
    laserNullEven: false,
    pref: "aucun",
    prefBonus: 0,
    nonvital: "aucun",
    tech: null,
    note: "F. alliance 1, valeur 12.",
  },
  {
    id: "oz",
    name: "MINÉRAUX D'OZ",
    kingdom: "mineral",
    klass: "oz",
    blurb: "Pierres qui montrent l'aura d'un pensant à un kilomètre. En cueillir une éteint toutes les autres. Aucun risque s'il n'y a pas d'autre vie.",
    fc: 0,
    temperament: "pacific",
    missions: ["collect"],
    elim: 2,
    capture: 0,
    fall: 0,
    alliance: 0,
    presence: [0, 0, 0, 0, 0, 0],
    arrivals: [0, 0, 0, 0, 0, 0],
    poison: false,
    shipsImmune: true,
    laserNullEven: false,
    pref: "—",
    prefBonus: 0,
    nonvital: "—",
    tech: null,
    note: "2 points, une seule cueillette.",
  },
  {
    id: "secor",
    name: "SECOR",
    kingdom: "vegetal",
    klass: "secor",
    blurb: "Fleurs des déserts absolus, gemmes végétales SKOR. Quatre points, sans risque. Inutile de tirer la zone d'atterrissage : ce sera toujours le désert.",
    fc: 0,
    temperament: "pacific",
    missions: ["collect"],
    elim: 4,
    capture: 0,
    fall: 0,
    alliance: 0,
    presence: [0, 0, 0, 0, 0, 0],
    arrivals: [0, 0, 0, 0, 0, 0],
    poison: false,
    shipsImmune: true,
    laserNullEven: false,
    pref: "désert",
    prefBonus: 0,
    nonvital: "—",
    tech: null,
    note: "4 points. Le cas mixte Secor + non-sapiens n'est pas généré tant qu'il n'est pas arbitré.",
  },
];

export function raceById(id: string): Race | undefined {
  return RACES.find((r) => r.id === id);
}

/** Niveau I — ancré sur l'exemple : dé 1 = A terrestre, dé 6 = E martien. Dé 10 = D.N.S. */
export const PLANET_TYPES: { id: string; name: string }[] = [
  { id: "A", name: "terrestre" },
  { id: "B", name: "vénusien" },
  { id: "C", name: "sélénite" },
  { id: "D", name: "mercurien" },
  { id: "F", name: "cérèsien" },
  { id: "E", name: "martien" },
  { id: "G", name: "jovien" },
  { id: "H", name: "saturnien" },
  { id: "I", name: "neptunien" },
];

/**
 * Niveau II, dé 6, index 0 = dé 1.
 * Terrestre dé 2 = végétal : ancré sur l'exemple.
 * Les autres types sont une répartition provisoire, marquée au codex.
 */
export const KINGDOM_BY_TYPE: Record<string, ("animal" | "vegetal" | "mineral" | "secor" | "sterile" | "dns")[]> = {
  A: ["animal", "vegetal", "vegetal", "mineral", "secor", "sterile"],
  B: ["mineral", "vegetal", "animal", "sterile", "secor", "dns"],
  C: ["mineral", "sterile", "mineral", "animal", "sterile", "dns"],
  D: ["mineral", "mineral", "sterile", "animal", "vegetal", "dns"],
  F: ["mineral", "sterile", "mineral", "secor", "sterile", "dns"],
  E: ["mineral", "mineral", "vegetal", "animal", "sterile", "dns"],
  G: ["mineral", "sterile", "mineral", "vegetal", "sterile", "dns"],
  H: ["mineral", "sterile", "secor", "mineral", "sterile", "dns"],
  I: ["mineral", "sterile", "animal", "vegetal", "sterile", "dns"],
};

export const ERRATA: { title: string; body: string }[] = [
  {
    title: "L'exemple est une Frombola, grade Decurio",
    body: "Le livret italien dit « GLADIUM (livello 1) » et déjà « Decurio », pas Centurio. La route fait 10 Nord + 5 Est = 15 parsecs, avec 3 réservoirs. Seule la Frombola pousse à 5 parsecs par réservoir (3 × 5 = 15). Un Gladium à ×4 ne couvre que 12. Le grade du chapitre d'introduction, « Centuno », est une coquille pour Centurio — ce n'est pas le grade de l'exemple. Le moteur part donc Decurio, nef FROMBOLA, niveau 0.",
  },
  {
    title: "L'exemple ne rentre pas dans 10 postes",
    body: "Si l'on compte 5 boucliers et 3 lasers comme des conteneurs, l'allègement de l'exemple fait 16 postes : c'est le Gladium, pas la Frombola (10). Le texte dit pourtant FROMBOLA = 10 et GLADIUM = 16. Je n'ai pas truqué la capacité. « Scudi difensivi 5 » peut vouloir dire le facteur 5 d'un seul bouclier — même ainsi, 2 équipages + 1 bouclier + 3 lasers + 2 radars + 1 Mater + 3 réservoirs = 12, encore au-dessus de 10. Arbitrage : la Frombola reste à 10 postes.",
  },
  {
    title: "Sevolventes : F.C. 2, pas 5",
    body: "La guida donne F.C. 2, présences 1-2 → 2, 3-4 → 4, 5-6 → 6, arrivées 1-2 → 1, 3-4-5 → 3, 6 → 5, élimination 5. L'exemple dit « 5 punti ciascuno » puis « 5 punti si lo imbarchi ». Le 5 de gain colle à la valeur d'élimination. Le F.C. 5 contredit la guida. Le moteur suit la guida. L'arrivée au dé 2 (un Sevolventes de plus) colle déjà à la table des arrivées.",
  },
  {
    title: "Spatha 19 postes, Hasta 21 — pas 10",
    body: "La scheda fan recopié « 10 posti » sur la Spatha et l'Hasta, copie de la Frombola. La ligne « totale massimo » dit 19 et 21. Le moteur retient 19 et 21. La case grade de l'Hasta est vide sur cette scheda : j'aligne Proconsul = Spatha, Consul = Hasta, et la promotion du Consul fait Fabius — victoire. Cinq grades, quatre nefs : il n'y a pas de cinquième coque.",
  },
  {
    title: "Poussée et masse",
    body: "Le règlement : une nef plus lourde parcourt moins de parsecs par réservoir. La scheda donne Frombola ×5, Gladium ×4, puis Spatha ×5 (copie) et Hasta ×4. J'applique 5, 4, 3, 2. À contredire si votre feuille imprimée dit autre chose.",
  },
  {
    title: "Seuils de promotion",
    body: "Pris sur la scheda d'allestimento : Frombola 6, Gladium 6, Spatha 7, Hasta 8. L'exemple, avec son niveau erroné, totalise 7 et promeut. Ce n'est pas le seuil de la Frombola. Chaque gain est diminué du niveau de la nef, comme écrit — la Frombola, niveau 0, ne soustrait rien.",
  },
  {
    title: "Tableaux A à L, P, Q, M, N, R",
    body: "Absents des livrets narratifs. Les tables A et B du moteur sont provisoires, monotones, et respectent deux cases de l'exemple : table B, dé 1, facteur 3 contre 5, résultat rien ; table A, dé 6, peut donner F (moitié des facteurs, arrondi au supérieur). Table C provisoire : 1 bouclier, 2 laser, 3 radar, 4 Mater, 5 réservoir, 6 coque. Deux coques successives dans le même tour détruisent la nef. Élément absent : le coup est nul. Les vaisseaux Knox / Brucel et la table P des zones d'atterrissage ne sont pas actifs : leurs grilles manquent. Les risques de l'externe (trou noir, filets, distorsions) suivent les formules écrites.",
  },
  {
    title: "Tabula",
    body: "Le format imprimé de la grille n'est pas chiffré dans les livrets. Le secteur fait 16 × 16 parsecs par niveau, quatre niveaux, neuf mondes par niveau dont une base, distance de Tchebychev (le « 2 Ouest + 1 Nord-Ouest » de l'exemple vaut 3). À remplacer si votre feuille a d'autres bords.",
  },
  {
    title: "Ce que l'externe ne fait pas encore",
    body: "Personnalité du commandant : oui (0 à 5), elle pèse sur l'alliance, la vénération, la désertion chez les sapiens civiles. Radioactivité α / β : oui, provisoire au dé (1-2 rien, 3-4 α, 5-6 β), combinaisons −1 / −2 au facteur d'équipage. Princeps PSI, Robur, officiers scientifiques, table R : non. Ambiances de film et voix : plus tard, comme vous l'avez cadré.",
  },
];

export const GRID = 16;
