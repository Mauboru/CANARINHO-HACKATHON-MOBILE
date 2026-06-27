import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import canarinho from "@/assets/canarinho.png";
import canarinhoCelebrate from "@/assets/canarinho-celebrate.png";
import { SAMPLE_PROPERTY } from "@/lib/sample-property";

const MapLesson = lazy(() => import("@/components/MapLesson"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canarinho CAR — Regularize sua propriedade com o canarinho-da-terra" },
      {
        name: "description",
        content:
          "Trilha de aprendizado estilo Duolingo para produtores rurais preencherem o SICAR e regularizarem a propriedade, passo a passo, com o mascote canarinho-da-terra.",
      },
      { property: "og:title", content: "Canarinho CAR" },
      { property: "og:description", content: "Aprenda a regularizar sua propriedade no SICAR, lição por lição." },
    ],
  }),
  component: App,
});

/* ---------- Trail data: mirrors the SICAR flow ---------- */

type LessonStatus = "done" | "current" | "locked";
type LessonKind = "lesson" | "practice" | "checkpoint" | "trophy" | "map";
type MapMode = "polygon" | "point" | "line" | "buffer";

interface Lesson {
  id: string;
  title: string;
  status: LessonStatus;
  kind: LessonKind;
  map?: {
    mode: MapMode;
    instruction: string;
    gabarito: [number, number][] | [number, number];
    baseLine?: [number, number][];
    bufferMeters?: number;
  };
}
interface Unit {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: "primary" | "accent" | "earth";
  lessons: Lesson[];
}

const UNITS: Unit[] = [
  {
    id: "u1",
    number: 1,
    title: "Unidade 1 · Preparando o cadastro",
    subtitle: "Documentos, login Gov.br e instalação do SICAR",
    color: "primary",
    lessons: [
      { id: "l1", title: "O que é o CAR?", status: "done", kind: "lesson" },
      { id: "l2", title: "Documentos da propriedade", status: "done", kind: "lesson" },
      { id: "l3", title: "Login no Gov.br", status: "done", kind: "practice" },
      { id: "l4", title: "Checkpoint da Unidade 1", status: "current", kind: "checkpoint" },
      { id: "l5", title: "Instalar o SICAR", status: "locked", kind: "lesson" },
    ],
  },
  {
    id: "u2",
    number: 2,
    title: "Unidade 2 · Desenhando o imóvel",
    subtitle: "Perímetro, sede e área de uso consolidado",
    color: "accent",
    lessons: [
      {
        id: "l6",
        title: "Perímetro do imóvel",
        status: "current",
        kind: "map",
        map: {
          mode: "polygon",
          instruction: "Use a ferramenta de polígono e desenhe o contorno da propriedade seguindo as cercas visíveis na imagem de satélite.",
          gabarito: SAMPLE_PROPERTY.perimeter,
        },
      },
      {
        id: "l7",
        title: "Marcando a sede",
        status: "current",
        kind: "map",
        map: {
          mode: "point",
          instruction: "Coloque um ponto exatamente sobre a construção principal (sede) da fazenda.",
          gabarito: SAMPLE_PROPERTY.sede,
        },
      },
      {
        id: "l8",
        title: "Área consolidada (pasto)",
        status: "locked",
        kind: "map",
        map: {
          mode: "polygon",
          instruction: "Desenhe o polígono da área de pasto / uso consolidado dentro do imóvel.",
          gabarito: SAMPLE_PROPERTY.consolidada,
        },
      },
      {
        id: "l9",
        title: "Servidão e estradas",
        status: "locked",
        kind: "map",
        map: {
          mode: "line",
          instruction: "Trace uma linha sobre a estrada/servidão que corta o imóvel.",
          gabarito: SAMPLE_PROPERTY.estrada,
        },
      },
      { id: "l10", title: "Troféu da Unidade 2", status: "locked", kind: "trophy" },
    ],
  },
  {
    id: "u3",
    number: 3,
    title: "Unidade 3 · APP e Reserva Legal",
    subtitle: "Áreas de Preservação Permanente e RL",
    color: "primary",
    lessons: [
      { id: "l11", title: "O que é APP?", status: "locked", kind: "lesson" },
      {
        id: "l12",
        title: "Mata ciliar dos rios",
        status: "locked",
        kind: "map",
        map: {
          mode: "buffer",
          instruction: "Desenhe a faixa de APP de 30 m sobre cada margem do rio (linha azul tracejada).",
          gabarito: SAMPLE_PROPERTY.rio,
          baseLine: SAMPLE_PROPERTY.rio,
          bufferMeters: 30,
        },
      },
      { id: "l13", title: "Reserva Legal", status: "locked", kind: "practice" },
      { id: "l14", title: "Envio do CAR", status: "locked", kind: "trophy" },
    ],
  },
];

/* ---------- Helpers ---------- */

function unitToken(color: Unit["color"]) {
  if (color === "primary")
    return {
      bg: "bg-primary",
      shadow: "bg-primary-shadow",
      text: "text-primary-foreground",
      ring: "ring-primary",
      banner: "bg-primary",
    };
  if (color === "accent")
    return {
      bg: "bg-accent",
      shadow: "bg-accent-shadow",
      text: "text-accent-foreground",
      ring: "ring-accent",
      banner: "bg-accent",
    };
  return {
    bg: "bg-earth",
    shadow: "bg-earth/60",
    text: "text-earth-foreground",
    ring: "ring-earth",
    banner: "bg-earth",
  };
}

/* ---------- Top header (HUD) ---------- */

function HUD() {
  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-[0_2px_0_0_var(--color-border)]">
          <span className="text-lg">🇧🇷</span>
          <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">PT-BR</span>
        </div>
        <div className="flex items-center gap-2">
          <Pill icon="🔥" value="7" color="streak" />
          <Pill icon="🌽" value="240" color="accent" />
          <Pill icon="❤" value="4" color="heart" />
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, value, color }: { icon: string; value: string; color: "streak" | "accent" | "heart" }) {
  const cls =
    color === "streak"
      ? "text-streak"
      : color === "accent"
        ? "text-accent-shadow"
        : "text-heart";
  return (
    <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 shadow-[0_2px_0_0_var(--color-border)]">
      <span className={`text-base leading-none ${cls}`}>{icon}</span>
      <span className="text-sm font-extrabold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

/* ---------- Unit banner ---------- */

function UnitBanner({ unit }: { unit: Unit }) {
  const t = unitToken(unit.color);
  return (
    <div
      className={`relative mt-6 overflow-hidden rounded-2xl ${t.banner} px-5 py-4 shadow-[0_4px_0_0_var(--color-primary-shadow)]`}
      style={
        unit.color === "accent"
          ? { boxShadow: "0 4px 0 0 var(--color-accent-shadow)" }
          : unit.color === "earth"
            ? { boxShadow: "0 4px 0 0 oklch(0.4 0.06 60)" }
            : undefined
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`min-w-0 ${t.text}`}>
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] opacity-80">
            Seção · Unidade {unit.number}
          </p>
          <h2 className="mt-0.5 truncate text-lg font-black">{unit.title.split("·")[1]?.trim()}</h2>
          <p className="text-xs font-bold opacity-85">{unit.subtitle}</p>
        </div>
        <button
          className={`shrink-0 rounded-xl border-2 border-white/30 ${t.text} px-3 py-2 text-[0.7rem] font-black uppercase tracking-wider hover:bg-white/10`}
        >
          Guia
        </button>
      </div>
    </div>
  );
}

/* ---------- Lesson node (the round Duolingo button) ---------- */

function lessonIcon(kind: LessonKind, status: LessonStatus) {
  if (status === "locked") return "🔒";
  if (kind === "checkpoint") return "🗝";
  if (kind === "trophy") return "🏆";
  if (kind === "practice") return "📍";
  if (kind === "map") return "🗺";
  return "📘";
}

function LessonNode({
  lesson,
  unit,
  offset,
  onPick,
  active,
}: {
  lesson: Lesson;
  unit: Unit;
  offset: number;
  onPick: (l: Lesson) => void;
  active: boolean;
}) {
  const t = unitToken(unit.color);
  const isDone = lesson.status === "done";
  const isLocked = lesson.status === "locked";
  const isCurrent = lesson.status === "current";

  const baseColor = isDone
    ? "bg-primary"
    : isLocked
      ? "bg-muted"
      : t.bg;
  const shadowColor = isDone
    ? "var(--color-primary-shadow)"
    : isLocked
      ? "oklch(0.82 0.02 110)"
      : unit.color === "accent"
        ? "var(--color-accent-shadow)"
        : unit.color === "earth"
          ? "oklch(0.4 0.06 60)"
          : "var(--color-primary-shadow)";

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isCurrent && (
        <div className="mb-2 rounded-xl border-2 border-accent-shadow bg-white px-3 py-1.5 shadow-[0_3px_0_0_var(--color-accent-shadow)]">
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-accent-shadow">Comece</p>
        </div>
      )}
      <button
        onClick={() => !isLocked && onPick(lesson)}
        disabled={isLocked}
        className={`group relative grid h-20 w-20 place-items-center rounded-full ${baseColor} ${
          isLocked ? "text-muted-foreground" : "text-white"
        } transition active:translate-y-1`}
        style={{ boxShadow: `0 6px 0 0 ${shadowColor}` }}
        aria-label={lesson.title}
      >
        {active && (
          <span className="pointer-events-none absolute inset-0 -m-2 animate-ping rounded-full border-4 border-accent opacity-40" />
        )}
        <span className="text-3xl drop-shadow-sm">{lessonIcon(lesson.kind, lesson.status)}</span>
        {isDone && (
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-4 border-background bg-primary text-xs font-black text-white">
            ✓
          </span>
        )}
      </button>
      <p
        className={`mt-2 max-w-[10rem] text-center text-[0.72rem] font-extrabold leading-tight ${
          isLocked ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {lesson.title}
      </p>
    </div>
  );
}

/* ---------- Mascot speech bubble between units ---------- */

function MascotTip({ text }: { text: string }) {
  return (
    <div className="mx-auto my-6 flex max-w-sm items-end gap-3 px-2">
      <img
        src={canarinho}
        alt="Canarinho-da-terra"
        width={88}
        height={88}
        loading="lazy"
        className="h-22 w-22 shrink-0 drop-shadow"
      />
      <div className="relative flex-1 rounded-2xl border-2 border-border bg-white p-3 shadow-[0_3px_0_0_var(--color-border)]">
        <p className="text-sm font-bold leading-snug text-foreground">{text}</p>
        <span className="absolute -left-2 bottom-3 h-3 w-3 rotate-45 border-b-2 border-l-2 border-border bg-white" />
      </div>
    </div>
  );
}

/* ---------- Bottom nav ---------- */

const NAV = [
  { id: "trail", icon: "🌱", label: "Trilha" },
  { id: "sicar", icon: "🗺", label: "SICAR" },
  { id: "shop", icon: "🛒", label: "Loja" },
  { id: "profile", icon: "👤", label: "Perfil" },
];

function BottomNav({ tab, onTab }: { tab: string; onTab: (v: string) => void }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t-2 border-border bg-background/95 px-2 py-2 backdrop-blur">
      <ul className="grid grid-cols-4 gap-1">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <li key={n.id}>
              <button
                onClick={() => onTab(n.id)}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[0.68rem] font-black uppercase tracking-wider transition ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xl leading-none">{n.icon}</span>
                {n.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- Lesson sheet (SICAR-mirrored exercise) ---------- */

const QUESTIONS: Record<string, { prompt: string; sicarHint: string; options: string[]; correct: number }> = {
  default: {
    prompt: "No SICAR, qual aba você abre primeiro para iniciar o cadastro de um novo imóvel rural?",
    sicarHint: "Tela inicial do SICAR Desktop — menu superior",
    options: ["Cadastrar > Imóvel Rural", "Retificar > Imóvel", "Consultar > CAR", "Configurações"],
    correct: 0,
  },
};

function LessonSheet({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const q = QUESTIONS.default;
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [mapDone, setMapDone] = useState<{ ok: boolean; msg: string } | null>(null);
  const isMap = lesson.kind === "map" && lesson.map;
  const correct = isMap ? !!mapDone?.ok : checked && picked === q.correct;

  if (isMap && lesson.map) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center">
        <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
          <div className="flex items-center gap-3 px-5 py-4">
            <button onClick={onClose} aria-label="Fechar" className="text-2xl font-black text-muted-foreground">
              ×
            </button>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: mapDone?.ok ? "100%" : "40%" }}
              />
            </div>
            <span className="text-sm">❤ <b>4</b></span>
          </div>
          <div className="px-5 pb-2">
            <p className="text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground">
              {lesson.title}
            </p>
            <h3 className="mt-1 text-base font-black leading-tight">Espelho do SICAR · desenho no mapa</h3>
          </div>
          <div className="px-5 pb-4">
            <Suspense
              fallback={
                <div className="grid h-[340px] place-items-center rounded-2xl border-2 border-border bg-muted/40 text-sm font-bold text-muted-foreground">
                  Carregando mapa…
                </div>
              }
            >
              <MapLesson
                lessonId={lesson.id}
                mode={lesson.map.mode}
                gabarito={lesson.map.gabarito}
                baseLine={lesson.map.baseLine}
                bufferMeters={lesson.map.bufferMeters}
                instruction={lesson.map.instruction}
                onResult={(ok, msg) => setMapDone({ ok, msg })}
              />
            </Suspense>
          </div>
          {mapDone && (
            <div className={`flex items-center gap-3 px-5 py-4 ${mapDone.ok ? "bg-primary/10" : "bg-heart/10"}`}>
              <img
                src={mapDone.ok ? canarinhoCelebrate : canarinho}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14"
              />
              <p className={`flex-1 text-sm font-black ${mapDone.ok ? "text-primary" : "text-heart"}`}>
                {mapDone.msg}
              </p>
              {mapDone.ok && (
                <button
                  onClick={onClose}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-black uppercase text-primary-foreground"
                  style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
                >
                  Continuar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        {/* Header progress */}
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={onClose} aria-label="Fechar" className="text-2xl font-black text-muted-foreground">
            ×
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/5 rounded-full bg-primary" />
          </div>
          <span className="text-sm">❤ <b>4</b></span>
        </div>

        {/* Mock SICAR screenshot panel */}
        <div className="mx-5 overflow-hidden rounded-2xl border-2 border-border bg-white shadow-[0_3px_0_0_var(--color-border)]">
          <div className="flex items-center gap-1.5 bg-[oklch(0.92_0.02_120)] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="ml-2 text-[0.7rem] font-bold text-muted-foreground">SICAR · {q.sicarHint}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] text-[0.7rem]">
            <div className="space-y-1 border-r border-border bg-muted/60 p-2 font-bold text-muted-foreground">
              <p className="rounded bg-primary/15 px-1.5 py-1 text-primary">Cadastrar</p>
              <p className="px-1.5 py-1">Retificar</p>
              <p className="px-1.5 py-1">Consultar</p>
              <p className="px-1.5 py-1">Enviar</p>
            </div>
            <div className="space-y-1.5 p-2">
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/2 rounded bg-muted" />
              <div className="mt-2 h-14 rounded border border-dashed border-border bg-[oklch(0.97_0.02_140)]" />
              <div className="h-2 w-2/3 rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="px-5 pb-3 pt-4">
          <p className="text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground">
            {lesson.title}
          </p>
          <h3 className="mt-1 text-lg font-black leading-tight">{q.prompt}</h3>
        </div>

        <div className="space-y-2 px-5 pb-4">
          {q.options.map((opt, i) => {
            const sel = picked === i;
            const correctOpt = checked && i === q.correct;
            const wrongPicked = checked && sel && i !== q.correct;
            return (
              <button
                key={opt}
                onClick={() => !checked && setPicked(i)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition ${
                  correctOpt
                    ? "border-primary bg-primary/10 text-primary"
                    : wrongPicked
                      ? "border-heart bg-heart/10 text-heart"
                      : sel
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white hover:border-primary/50"
                }`}
                style={{ boxShadow: sel ? "0 3px 0 0 var(--color-primary-shadow)" : "0 3px 0 0 var(--color-border)" }}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-current text-xs font-black">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback bar */}
        <div
          className={`px-5 py-4 transition ${
            checked ? (correct ? "bg-primary/10" : "bg-heart/10") : "bg-muted/50"
          }`}
        >
          {checked ? (
            <div className="flex items-center gap-3">
              <img
                src={correct ? canarinhoCelebrate : canarinho}
                alt=""
                width={56}
                height={56}
                loading="lazy"
                className="h-14 w-14"
              />
              <div className="flex-1">
                <p className={`text-sm font-black ${correct ? "text-primary" : "text-heart"}`}>
                  {correct ? "Boa! Resposta certa." : "Quase! No SICAR, é Cadastrar > Imóvel Rural."}
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  Dica: é por essa aba que você inicia todo o desenho do imóvel.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-black uppercase text-primary-foreground"
                style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
              >
                Continuar
              </button>
            </div>
          ) : (
            <button
              onClick={() => picked !== null && setChecked(true)}
              disabled={picked === null}
              className={`w-full rounded-xl py-3 text-sm font-black uppercase tracking-wider transition ${
                picked === null
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground active:translate-y-0.5"
              }`}
              style={{
                boxShadow: picked === null ? "none" : "0 4px 0 0 var(--color-primary-shadow)",
              }}
            >
              Verificar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- App shell ---------- */

function App() {
  const [tab, setTab] = useState("trail");
  const [open, setOpen] = useState<Lesson | null>(null);

  const totalDone = useMemo(
    () => UNITS.flatMap((u) => u.lessons).filter((l) => l.status === "done").length,
    [],
  );

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.02_120)] py-6 sm:py-10">
      {/* Phone frame */}
      <div className="mx-auto flex w-full max-w-[420px] flex-col overflow-hidden rounded-[2.25rem] border-[10px] border-foreground/90 bg-background shadow-2xl">
        <HUD />

        <main className="flex-1 px-5 pb-8">
          {tab === "trail" && (
            <>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Trilha do CAR
                  </p>
                  <h1 className="text-2xl font-black leading-tight">
                    Olá, Seu João! <span className="text-base">🌾</span>
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    {totalDone} de 14 lições · Sítio Boa Vista
                  </p>
                </div>
                <img
                  src={canarinho}
                  alt="Mascote canarinho-da-terra"
                  width={72}
                  height={72}
                  className="h-18 w-18"
                />
              </div>

              {UNITS.map((unit, ui) => (
                <section key={unit.id}>
                  <UnitBanner unit={unit} />
                  <div className="relative mt-6 flex flex-col items-center gap-7 pb-2">
                    {unit.lessons.map((lesson, i) => {
                      // zig-zag offsets
                      const pattern = [0, 60, 80, 30, -40, -70, -30];
                      const offset = pattern[i % pattern.length];
                      return (
                        <LessonNode
                          key={lesson.id}
                          lesson={lesson}
                          unit={unit}
                          offset={offset}
                          onPick={setOpen}
                          active={lesson.status === "current"}
                        />
                      );
                    })}
                  </div>
                  {ui === 0 && (
                    <MascotTip text="Quando travar no SICAR, eu te mostro a tela exata pra clicar. Bora?" />
                  )}
                </section>
              ))}

              <div className="mt-8 rounded-2xl border-2 border-border bg-white p-4 text-center shadow-[0_3px_0_0_var(--color-border)]">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Espelho do SICAR
                </p>
                <p className="mt-1 text-sm font-bold">
                  Cada lição reflete uma tela real do programa SICAR — você aprende clicando onde clicaria de verdade.
                </p>
              </div>
            </>
          )}

          {tab !== "trail" && (
            <div className="grid min-h-[60vh] place-items-center text-center">
              <div>
                <img src={canarinho} alt="" width={140} height={140} className="mx-auto h-32 w-32" />
                <p className="mt-4 text-base font-black uppercase tracking-widest text-muted-foreground">
                  Em breve
                </p>
                <p className="mt-1 text-sm font-bold">Esta área do app ainda está no ninho.</p>
              </div>
            </div>
          )}
        </main>

        <BottomNav tab={tab} onTab={setTab} />
      </div>

      <p className="mx-auto mt-4 max-w-[420px] px-5 text-center text-xs font-bold text-muted-foreground">
        Protótipo · Canarinho CAR — trilha de regularização ambiental para produtores rurais
      </p>

      {open && <LessonSheet lesson={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
