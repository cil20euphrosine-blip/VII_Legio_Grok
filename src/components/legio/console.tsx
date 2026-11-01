import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, ClipboardList, PencilLine } from "lucide-react";
import {
  DIR_LABEL,
  ERRATA,
  RANK_LABEL,
  apply,
  dock,
  ficheLine,
  fitError,
  focusCount,
  loadGame,
  menLabel,
  newGame,
  routeCost,
  saveGame,
  shipOf,
  slotsOf,
  starterFit,
  type Act,
  type Dir,
  type DockItem,
  type Fit,
  type Game,
} from "@/lib/legio/engine";
import type { ShipClass } from "@/lib/legio/content";

type Sheet = "fiche" | "feuille" | "codex";

const DIRS: Dir[] = ["NO", "N", "NE", "O", "E", "SO", "S", "SE"];

export function Console() {
  const [game, setGame] = useState<Game | null>(null);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    setGame(loadGame());
    setBooted(true);
  }, []);

  function commit(next: Game | null) {
    setGame(next);
    saveGame(next);
  }

  function act(a: Act) {
    if (busy.current) return;
    busy.current = true;
    setGame((prev) => {
      if (!prev) return prev;
      const next = apply(prev, a);
      saveGame(next);
      return next;
    });
    requestAnimationFrame(() => {
      busy.current = false;
    });
  }

  if (!booted) {
    return (
      <Screen>
        <p className="text-fade">L'Espace Ordinateur s'aligne.</p>
      </Screen>
    );
  }

  if (!game) {
    return (
      <Gate
        onStart={(sector) => {
          commit(newGame(sector));
          setSheet(null);
        }}
      />
    );
  }

  return (
    <Screen>
      <Header game={game} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {sheet ? (
          <Paper
            game={game}
            sheet={sheet}
            onAbandon={() => {
              commit(null);
              setSheet(null);
            }}
          />
        ) : (
          <Log game={game} />
        )}
      </div>
      <footer className="shrink-0 border-t border-line px-4 pt-3 pb-safe">
        <div className="mb-3 grid grid-cols-3 gap-2">
          <Tab id="fiche" label="Fiche" sheet={sheet} setSheet={setSheet} />
          <Tab id="feuille" label="Feuille" sheet={sheet} setSheet={setSheet} />
          <Tab id="codex" label="Codex" sheet={sheet} setSheet={setSheet} />
        </div>
        <div className="max-h-dock overflow-y-auto overscroll-contain">
          <Order game={game} />
          <Actions game={game} onAct={act} />
        </div>
      </footer>
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-app justify-center bg-ink text-parchment">
      <div className="flex h-app w-full max-w-2xl flex-col">{children}</div>
    </div>
  );
}

function Gate({ onStart }: { onStart: (sector: "interne" | "externe") => void }) {
  return (
    <Screen>
      <main className="flex flex-1 flex-col justify-center px-6 pb-safe">
        <p className="font-display text-sm tracking-widest text-gold">VII</p>
        <h1 className="mt-1 font-display text-4xl leading-none">LEGIO</h1>
        <p className="mt-5 text-lg leading-snug">
          L'Espace Ordinateur tient la tabula. Vous ne la verrez pas.
        </p>
        <p className="mt-3 text-fade">
          Une fiche de nef. Une feuille blanche. Un crayon. Vous consignez vos déplacements. Vous ne les tracez pas.
        </p>
        <div className="mt-8 grid gap-3">
          <Btn tone="gold" onClick={() => onStart("interne")}>
            <span className="block font-display tracking-wide">Secteur interne</span>
            <span className="mt-0.5 block text-sm font-normal">Niveau basique</span>
          </Btn>
          <Btn tone="ghost" onClick={() => onStart("externe")}>
            <span className="block font-display tracking-wide">Secteur externe</span>
            <span className="mt-0.5 block text-sm font-normal text-fade">Niveau avancé. Votre caractère compte.</span>
          </Btn>
        </div>
      </main>
    </Screen>
  );
}

function Header({ game }: { game: Game }) {
  const ship = shipOf(game);
  const where = place(game);
  return (
    <header className="shrink-0 border-b border-line px-4 pt-safe pb-3">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-lg tracking-widest">VII LEGIO</h1>
        <p className="text-sm text-gold">{game.points} pts</p>
      </div>
      <p className="mt-1 text-sm text-fade">
        Espace Ordinateur · {game.sector === "interne" ? "secteur interne" : "secteur externe"}
      </p>
      <p className="mt-2 text-sm leading-snug">
        {RANK_LABEL[game.rank]}
        {game.officer ? ` ${game.officer}` : ""}
        {" · "}
        {ship.name}
        {game.shipName ? ` ${game.shipName}` : ""}
        {" · tour "}
        {game.turn}
        {" · "}
        {menLabel(game)}
        {game.ashore > 0 ? ` · ${game.ashore} au sol` : ""}
        {game.shieldsUp ? " · boucliers" : ""}
        {where ? ` · ${where}` : ""}
      </p>
    </header>
  );
}

function place(game: Game): string | null {
  if (game.phase.t === "officer" || game.phase.t === "ship" || game.phase.t === "fit" || game.phase.t === "persona") {
    return null;
  }
  if (!game.onPlanet) return "dans le vide";
  const p = game.planets.find((item) => item.id === game.onPlanet);
  if (!p) return null;
  return p.base ? "au bassin" : "posé";
}

function Order({ game }: { game: Game }) {
  const line = orderLine(game);
  if (!line) return null;
  return <p className="mb-3 text-sm leading-snug text-fade">{line}</p>;
}

function orderLine(game: Game): string | null {
  const ph = game.phase;
  if (ph.t === "officer") return "Nommez-vous. Le clavier ne sert qu'à cela, et au nom de la nef.";
  if (ph.t === "ship") return "Nommez la nef.";
  if (ph.t === "fit") return "Dix postes sur la Frombola. La fiche ne changera plus en vol.";
  if (ph.t === "refit") return "Au bassin. Les droidi refont la fiche. Cela ne coûte pas de tour.";
  if (ph.t === "persona") return "Zéro : diplomate. Cinq : vous cherchez le sang. Ce chiffre ne bougera plus.";
  if (ph.t === "route") return "Déclarez le cap et les parsecs. Haut et bas coûtent quatre, d'un bloc.";
  if (ph.t === "roll") return ph.blurb;
  if (ph.t === "focus") return "Sur combien portez-vous le feu ?";
  if (ph.t === "info") return `Mater encore en ligne : ${game.infoLeft}. Une demande chacune.`;
  if (ph.t === "attitude") return "Une attitude à la pose. Les hommes ne descendent pas deux fois dans le tour.";
  if (ph.t === "mission") return "Une mission. Le feu reste toujours un recours.";
  if (ph.t === "end") return "Le Sénat a tranché.";
  if (!game.onPlanet) return "Vous n'êtes pas posé. La position reste à l'ordinateur.";
  const p = game.planets.find((item) => item.id === game.onPlanet);
  if (p?.base) return "La base ne dit pas où elle se trouve dans le secteur.";
  return "Posé. Ce que vous savez du monde est dans l'échange, pas sur une carte.";
}

function Log({ game }: { game: Game }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    end.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [game.log.length, game.phase.t]);

  return (
    <div className="grid gap-5" aria-live="polite">
      {game.log.map((line, index) => (
        <article key={line.id} className={index === game.log.length - 1 ? "rise" : undefined}>
          <LogLine who={line.who} text={line.text} rank={RANK_LABEL[game.rank]} officer={game.officer} />
        </article>
      ))}
      <div ref={end} />
    </div>
  );
}

function LogLine({
  who,
  text,
  rank,
  officer,
}: {
  who: "sc" | "uc";
  text: string;
  rank: string;
  officer: string;
}) {
  const die = who === "uc" ? /^Dé : (\d+)\.$/.exec(text) : null;
  const hit = who === "sc" && /détruit|disloque|perdu/.test(text);
  if (die) {
    return (
      <div className="pl-8">
        <p className="font-display text-xs tracking-widest text-fade">{officer ? `${rank} ${officer}` : "VOUS"}</p>
        <p className="mt-1 font-display text-4xl text-gold">{die[1]}</p>
        <p className="text-sm text-fade">Votre dé</p>
      </div>
    );
  }
  return (
    <div className={who === "uc" ? "pl-8" : hit ? "border-l-2 border-seal pl-3" : undefined}>
      <p className="font-display text-xs tracking-widest text-gold">
        {who === "sc" ? "ESPACE ORDINATEUR" : officer ? `${rank} ${officer}` : "VOUS"}
      </p>
      <p className={who === "uc" ? "mt-1 text-fade italic" : "mt-1 leading-snug"}>{text}</p>
    </div>
  );
}

function Paper({ game, sheet, onAbandon }: { game: Game; sheet: Sheet; onAbandon: () => void }) {
  if (sheet === "fiche") return <Fiche game={game} />;
  if (sheet === "feuille") return <Feuille game={game} />;
  return <Codex onAbandon={onAbandon} />;
}

function Fiche({ game }: { game: Game }) {
  const ship = shipOf(game);
  const fit = game.fit;
  return (
    <section>
      <p className="font-display text-xs tracking-widest text-gold">FICHE DE NEF</p>
      <h2 className="mt-1 font-display text-2xl">
        {ship.name}
        {game.shipName ? ` ${game.shipName}` : ""}
      </h2>
      <p className="mt-1 text-sm text-fade">
        Niveau {ship.level} · {slotsOf(fit)} / {ship.slots} postes · poussée {fit.tanks} × {ship.thrust}
      </p>
      <div className="mt-4">
        <Row k="Équipages" v={fit.crews} />
        <Row k="Boucliers" v={fit.shields} />
        <Row k="Lasers de bord" v={fit.lasers} />
        <Row k="Radars" v={fit.radars} />
        <Row k="Mater" v={fit.computers} />
        <Row k="Réservoirs" v={fit.tanks} />
        <Row k="Modules" v={fit.modules} />
        <Row k="Zip / HO / Sil" v={`${fit.zip} / ${fit.ho} / ${fit.sil}`} />
        <Row k="Tot" v={fit.nukes} />
        <Row k="Hommes" v={menLabel(game)} />
        <Row k="Au sol" v={game.ashore} />
        <Row k="Promotion" v={`${ship.promo} pts`} />
      </div>
      <p className="mt-4 text-sm text-fade">{ficheLine(fit)}</p>
    </section>
  );
}

function Feuille({ game }: { game: Game }) {
  const ship = shipOf(game);
  return (
    <section>
      <p className="font-display text-xs tracking-widest text-gold">FEUILLE BLANCHE</p>
      <h2 className="mt-1 font-display text-2xl">Ce que le crayon retient</h2>
      <p className="mt-2 text-sm text-fade">
        Les routes ne se tracent pas. Elles se consignent, trait par trait, comme vous les avez dites.
      </p>
      <div className="mt-4 border-b border-line pb-3 text-sm">
        <p>
          {game.officer || "—"} · {RANK_LABEL[game.rank]}
        </p>
        <p>
          {game.shipName || "nef sans nom"} · {ship.name}
        </p>
        <p>
          {game.points} points · tour {game.turn}
        </p>
      </div>
      {game.feuille.length === 0 ? (
        <p className="mt-4 text-fade italic">La feuille est encore blanche.</p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {game.feuille.map((line, index) => (
            <li key={`${index}-${line}`} className="border-b border-line pb-3 italic">
              {line}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Codex({ onAbandon }: { onAbandon: () => void }) {
  const [arm, setArm] = useState(false);
  return (
    <section>
      <p className="font-display text-xs tracking-widest text-gold">CODEX</p>
      <h2 className="mt-1 font-display text-2xl">Corrections en vigueur</h2>
      <p className="mt-2 text-sm text-fade">
        Le moteur suit déjà ces décisions. Ce qui est marqué provisoire attend votre arbitrage.
      </p>
      <div className="mt-5 grid gap-5">
        {ERRATA.map((item) => (
          <article key={item.title}>
            <h3 className="font-display text-base text-gold">{item.title}</h3>
            <p className="mt-1 text-sm leading-snug text-fade">{item.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-2">
        {arm ? (
          <>
            <Btn tone="seal" onClick={onAbandon}>
              Confirmer l'abandon
            </Btn>
            <Btn tone="ghost" onClick={() => setArm(false)}>
              Rester en mission
            </Btn>
          </>
        ) : (
          <Btn tone="ghost" onClick={() => setArm(true)}>
            Abandonner et choisir le secteur
          </Btn>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2">
      <span className="text-fade">{k}</span>
      <span className="font-display">{v}</span>
    </div>
  );
}

function Tab({
  id,
  label,
  sheet,
  setSheet,
}: {
  id: Sheet;
  label: string;
  sheet: Sheet | null;
  setSheet: (next: Sheet | null) => void;
}) {
  const on = sheet === id;
  const Icon = id === "fiche" ? ClipboardList : id === "feuille" ? PencilLine : BookOpen;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setSheet(on ? null : id)}
      className={
        "flex min-h-tap items-center justify-center gap-1.5 border text-sm " +
        (on ? "border-gold bg-panel-2 text-gold" : "border-line bg-panel text-parchment")
      }
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function Actions({ game, onAct }: { game: Game; onAct: (a: Act) => void }) {
  const ph = game.phase;
  if (ph.t === "officer") {
    return <NamePad label="Votre nom" max={32} onSubmit={(name) => onAct({ t: "officer", name })} />;
  }
  if (ph.t === "ship") {
    return <NamePad label="Nom de la nef" max={24} onSubmit={(name) => onAct({ t: "ship", name })} />;
  }
  if (ph.t === "fit" || ph.t === "refit") {
    return <FitPad key={`${ph.t}-${game.shipId}-${game.turn}`} game={game} onAct={onAct} />;
  }
  if (ph.t === "route") {
    return <RoutePad key={game.seq} game={game} onAct={onAct} />;
  }
  if (ph.t === "focus") {
    return <FocusPad key={game.seq} game={game} onAct={onAct} />;
  }
  return <DockPad key={`${ph.t}-${game.seq}`} game={game} onAct={onAct} />;
}

function NamePad({ label, max, onSubmit }: { label: string; max: number; onSubmit: (name: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const name = value.trim();
        if (!name) return;
        onSubmit(name);
      }}
    >
      <label className="text-sm text-fade" htmlFor="legio-name">
        {label}
      </label>
      <input
        id="legio-name"
        value={value}
        maxLength={max}
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="done"
        onChange={(event) => setValue(event.target.value)}
        className="min-h-tap w-full border border-line bg-panel-2 px-3 text-base text-parchment outline-none placeholder:text-fade focus:border-gold"
      />
      <Btn tone="gold" submit disabled={!value.trim()}>
        Confirmer
      </Btn>
    </form>
  );
}

function FitPad({ game, onAct }: { game: Game; onAct: (a: Act) => void }) {
  const ship = shipOf(game);
  const [draft, setDraft] = useState<Fit>(game.fit);
  const err = fitError(ship, draft);
  const rows: { key: keyof Fit; label: string; note: string }[] = [
    { key: "crews", label: "Équipages", note: `minimum ${ship.minCrews}, trois hommes` },
    { key: "shields", label: "Boucliers", note: "défense 5, une fois levés" },
    { key: "lasers", label: "Lasers", note: "attaque 6 chacun" },
    { key: "radars", label: "Radars", note: `portée, ${ship.maxRadar} au plus` },
    { key: "computers", label: "Mater", note: "informations par tour" },
    { key: "tanks", label: "Réservoirs", note: `${ship.thrust} parsecs, ${ship.maxTanks} au plus` },
    { key: "modules", label: "Modules", note: "une arme chacun" },
  ];
  return (
    <div className="grid gap-2">
      <p className="text-sm text-fade">
        Postes {slotsOf(draft)} / {ship.slots}
        {ship.nuke ? " · Tot autorisé" : " · pas de Tot"}
      </p>
      {rows.map((row) => (
        <FitRow
          key={row.key}
          label={row.label}
          note={row.note}
          value={draft[row.key]}
          onDec={() => setDraft((fit) => bump(ship, fit, row.key, -1))}
          onInc={() => setDraft((fit) => bump(ship, fit, row.key, 1))}
        />
      ))}
      {draft.modules > 0 && (
        <>
          <p className="pt-1 text-sm text-fade">
            Zip 5 contre tout. HO fort sur l'animal. Sil fort sur le minéral. L'arme donne +1 en défense.
          </p>
          {(["zip", "ho", "sil"] as const).map((key) => (
            <FitRow
              key={key}
              label={key === "zip" ? "Zip" : key === "ho" ? "HO" : "Sil"}
              note="dans les modules"
              value={draft[key]}
              onDec={() => setDraft((fit) => bump(ship, fit, key, -1))}
              onInc={() => setDraft((fit) => bump(ship, fit, key, 1))}
            />
          ))}
        </>
      )}
      {ship.nuke && (
        <FitRow
          label="Tot"
          note="deux au plus"
          value={draft.nukes}
          onDec={() => setDraft((fit) => bump(ship, fit, "nukes", -1))}
          onInc={() => setDraft((fit) => bump(ship, fit, "nukes", 1))}
        />
      )}
      {err && <p className="text-sm text-gold">{err}</p>}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Btn tone="ghost" onClick={() => setDraft(starterFit(ship))}>
          Fiche type
        </Btn>
        <Btn tone="gold" disabled={!!err} onClick={() => onAct({ t: "fit", fit: draft })}>
          Valider
        </Btn>
      </div>
    </div>
  );
}

function bump(ship: ShipClass, fit: Fit, key: keyof Fit, delta: number): Fit {
  const next: Fit = { ...fit, [key]: fit[key] + delta };
  if (next[key] < 0) return fit;
  if (key === "crews" && next.crews < ship.minCrews) return fit;
  if (key === "radars" && next.radars > ship.maxRadar) return fit;
  if (key === "tanks" && next.tanks > ship.maxTanks) return fit;
  if (key === "nukes" && (!ship.nuke || next.nukes > 2)) return fit;
  if (key === "modules" && delta < 0) {
    let over = next.zip + next.ho + next.sil - next.modules;
    for (const weapon of ["sil", "ho", "zip"] as const) {
      while (over > 0 && next[weapon] > 0) {
        next[weapon] -= 1;
        over -= 1;
      }
    }
  }
  if ((key === "zip" || key === "ho" || key === "sil") && next.zip + next.ho + next.sil > next.modules) return fit;
  if (key !== "zip" && key !== "ho" && key !== "sil" && slotsOf(next) > ship.slots) return fit;
  return next;
}

function FitRow({
  label,
  note,
  value,
  onDec,
  onInc,
}: {
  label: string;
  note: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line py-1">
      <div>
        <p>{label}</p>
        <p className="text-sm text-fade">{note}</p>
      </div>
      <div className="flex items-center gap-2">
        <Small onClick={onDec} label={`Moins de ${label}`}>
          −
        </Small>
        <span className="w-6 text-center font-display text-xl">{value}</span>
        <Small onClick={onInc} label={`Plus de ${label}`}>
          +
        </Small>
      </div>
    </div>
  );
}

function RoutePad({ game, onAct }: { game: Game; onAct: (a: Act) => void }) {
  const ph = game.phase;
  const [dir, setDir] = useState<Dir>("N");
  const [n, setN] = useState(1);
  if (ph.t !== "route") return null;
  const ship = shipOf(game);
  const budget = game.fit.tanks * ship.thrust;
  const left = budget - routeCost(ph.segs);
  const vertical = dir === "HAUT" || dir === "BAS";
  const count = vertical ? 4 : Math.max(1, Math.min(n, Math.max(1, left)));
  const presets = [1, 5, 10, left].filter((value, index, all) => value >= 1 && value <= left && all.indexOf(value) === index);
  const written =
    ph.segs.length === 0
      ? "Aucun trait."
      : ph.segs
          .map((seg) => (seg.dir === "HAUT" || seg.dir === "BAS" ? `4 ${DIR_LABEL[seg.dir]}` : `${seg.n} ${DIR_LABEL[seg.dir]}`))
          .join(" + ");
  return (
    <div className="grid gap-2">
      <p className="text-sm text-fade">
        Poussée {left} / {budget}. Vous dites le cap. Vous ne le dessinez pas.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {DIRS.slice(0, 3).map((item) => (
          <Cap key={item} dir={item} current={dir} onPick={setDir} />
        ))}
        <Cap dir="O" current={dir} onPick={setDir} />
        <div className="flex min-h-tap items-center justify-center border border-line bg-panel font-display text-xs tracking-widest text-gold">
          {DIR_LABEL[dir]}
        </div>
        <Cap dir="E" current={dir} onPick={setDir} />
        {DIRS.slice(5).map((item) => (
          <Cap key={item} dir={item} current={dir} onPick={setDir} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Cap dir="HAUT" current={dir} onPick={setDir} wide />
        <Cap dir="BAS" current={dir} onPick={setDir} wide />
      </div>
      {!vertical && left > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {presets.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setN(value)}
              className={
                "min-h-tap border text-sm " + (count === value ? "border-gold text-gold" : "border-line text-parchment")
              }
            >
              {value === left && value !== 1 && value !== 5 && value !== 10 ? "Tout" : value}
            </button>
          ))}
        </div>
      )}
      {!vertical && (
        <div className="flex items-center justify-between gap-3">
          <Small label="Moins de parsecs" onClick={() => setN(Math.max(1, count - 1))}>
            −
          </Small>
          <p className="font-display text-xl">{count} parsecs</p>
          <Small label="Plus de parsecs" onClick={() => setN(Math.min(left, count + 1))}>
            +
          </Small>
        </div>
      )}
      {vertical && <p className="text-center font-display text-xl">4 parsecs</p>}
      <Btn
        tone="gold"
        disabled={vertical ? left < 4 : left < 1}
        onClick={() => onAct({ t: "add-seg", dir, n: vertical ? 4 : count })}
      >
        Ajouter {vertical ? `4 ${DIR_LABEL[dir]}` : `${count} ${DIR_LABEL[dir]}`}
      </Btn>
      <p className="text-sm italic">{written}</p>
      {ph.segs.length > 0 && (
        <Btn tone="ghost" onClick={() => onAct({ t: "pop-seg" })}>
          Effacer le dernier trait
        </Btn>
      )}
      <Btn tone={ph.landing ? "gold" : "ghost"} onClick={() => onAct({ t: "land-flag" })}>
        {ph.landing ? "Atterrissage en fin de route" : "Sans atterrissage"}
      </Btn>
      <Btn tone="gold" disabled={ph.segs.length === 0} onClick={() => onAct({ t: "send-route" })}>
        Envoyer la déclaration
      </Btn>
      <Btn tone="ghost" onClick={() => onAct({ t: "cancel-route" })}>
        Annuler
      </Btn>
    </div>
  );
}

function Cap({
  dir,
  current,
  onPick,
  wide,
}: {
  dir: Dir;
  current: Dir;
  onPick: (dir: Dir) => void;
  wide?: boolean;
}) {
  const on = dir === current;
  return (
    <button
      type="button"
      onClick={() => onPick(dir)}
      className={
        "min-h-tap border font-display text-sm tracking-wide " +
        (wide ? "" : "") +
        (on ? "border-gold bg-panel-2 text-gold" : "border-line bg-panel text-parchment")
      }
    >
      {dir === "HAUT" ? "Haut" : dir === "BAS" ? "Bas" : dir}
    </button>
  );
}

function FocusPad({ game, onAct }: { game: Game; onAct: (a: Act) => void }) {
  const max = focusCount(game);
  const [n, setN] = useState(1);
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Small label="Moins de cibles" onClick={() => setN((value) => Math.max(1, value - 1))}>
          −
        </Small>
        <p className="font-display text-xl">{n}</p>
        <Small label="Plus de cibles" onClick={() => setN((value) => Math.min(max, value + 1))}>
          +
        </Small>
      </div>
      <Btn tone="seal" onClick={() => onAct({ t: "focus", n })}>
        Viser {n === 1 ? "un seul" : `${n}`}
      </Btn>
    </div>
  );
}

function DockPad({ game, onAct }: { game: Game; onAct: (a: Act) => void }) {
  const items = dock(game);
  const cap = Math.min(game.fit.crews, Math.floor((game.men - game.ashore) / 3));
  const needsCrew =
    cap > 1 && items.some((item) => (item.act.t === "deploy" || item.act.t === "attitude") && item.act.crews > 0);
  const [crews, setCrews] = useState(Math.max(1, cap));
  const [arm, setArm] = useState(false);
  return (
    <div className="grid gap-2">
      {needsCrew && (
        <div className="flex items-center justify-between gap-3 pb-1">
          <Small label="Moins d'équipages" onClick={() => setCrews((value) => Math.max(1, value - 1))}>
            −
          </Small>
          <p className="text-sm">
            {crews} équipage{crews > 1 ? "s" : ""} à descendre
          </p>
          <Small label="Plus d'équipages" onClick={() => setCrews((value) => Math.min(cap, value + 1))}>
            +
          </Small>
        </div>
      )}
      {game.phase.t === "persona" ? (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <Btn key={item.label} tone={item.tone ?? "ghost"} onClick={() => onAct(item.act)}>
              {item.label}
            </Btn>
          ))}
        </div>
      ) : (
        items.map((item) => (
          <DockButton key={item.label + JSON.stringify(item.act)} item={item} crews={crews} cap={cap} arm={arm} setArm={setArm} onAct={onAct} />
        ))
      )}
    </div>
  );
}

function DockButton({
  item,
  crews,
  cap,
  arm,
  setArm,
  onAct,
}: {
  item: DockItem;
  crews: number;
  cap: number;
  arm: boolean;
  setArm: (arm: boolean) => void;
  onAct: (a: Act) => void;
}) {
  if (item.act.t === "rescue") {
    if (!arm) {
      return (
        <Btn tone="seal" onClick={() => setArm(true)}>
          Porte de sauvetage
        </Btn>
      );
    }
    return (
      <div className="grid gap-2">
        <Btn tone="seal" onClick={() => onAct(item.act)}>
          Confirmer — les points tombent à zéro
        </Btn>
        <Btn tone="ghost" onClick={() => setArm(false)}>
          Garder la nef
        </Btn>
      </div>
    );
  }
  let act = item.act;
  let label = item.label;
  if ((act.t === "deploy" || act.t === "attitude") && act.crews > 0) {
    act = { ...act, crews: Math.max(1, Math.min(crews, cap)) };
    if (act.t === "deploy") label = act.fight ? `Descendre ${act.crews} et tirer` : `Descendre ${act.crews}, sans tirer`;
    if (act.t === "attitude") label = act.k === "D" ? `Descendre ${act.crews} et tirer` : `Descendre ${act.crews}, sans tirer`;
  }
  return (
    <Btn tone={item.tone ?? "ghost"} onClick={() => onAct(act)}>
      {label}
    </Btn>
  );
}

function Small({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center border border-line bg-panel font-display text-xl text-parchment"
    >
      {children}
    </button>
  );
}

function Btn({
  children,
  onClick,
  tone,
  disabled,
  submit,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone: "gold" | "seal" | "ghost";
  disabled?: boolean;
  submit?: boolean;
}) {
  const face =
    tone === "gold"
      ? "bg-gold text-ink"
      : tone === "seal"
        ? "bg-seal text-parchment"
        : "border border-line bg-panel text-parchment";
  return (
    <button
      type={submit ? "submit" : "button"}
      disabled={disabled}
      onClick={onClick}
      className={"min-h-tap w-full px-3 py-2 text-base font-semibold disabled:opacity-40 " + face}
    >
      {children}
    </button>
  );
}
