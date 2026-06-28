import { createFileRoute } from "@tanstack/react-router";
import React, { lazy, Suspense, useMemo, useState, useEffect } from "react";
import { Leaf, Map, User, FileText, Trophy, MapPin, Lock, Key, BookOpen, Globe, Sparkles } from "lucide-react";
import canarinho from "@/assets/canarinho.png";
import canarinhoCelebrate from "@/assets/canarinho-celebrate.png";
import { SAMPLE_PROPERTY } from "@/lib/sample-property";
import AssistantChat from "@/components/AssistantChat";
import RemediationSheet from "@/components/RemediationSheet";

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
type LessonKind = "lesson" | "practice" | "checkpoint" | "trophy" | "map" | "remediation";
type RemediationType = "video" | "example" | "animation" | "exercise";
type MapMode = "polygon" | "point" | "line" | "buffer";

interface Lesson {
  id: string;
  title: string;
  status: LessonStatus;
  kind: LessonKind;
  tag?: string;
  remediation?: { type: RemediationType };
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

const DEFAULT_UNITS: Unit[] = [
  {
    id: "u1",
    number: 1,
    title: "Unidade 1 · Preparando o cadastro",
    subtitle: "Documentos, login Gov.br e instalação do SICAR",
    color: "primary",
    lessons: [
      { id: "l1", title: "O que é o CAR?", status: "current", kind: "lesson", tag: "sicar" },
      { id: "l2", title: "Documentos da propriedade", status: "locked", kind: "lesson" },
      { id: "l3", title: "Login no Gov.br", status: "locked", kind: "practice" },
      { id: "l4", title: "Checkpoint da Unidade 1", status: "locked", kind: "checkpoint" },
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
        status: "locked",
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
      { id: "l11", title: "O que é APP?", status: "current", kind: "lesson", tag: "app" },
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

function useUnits() {
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("canarinho_units");
      if (saved) {
        setUnits(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading units from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("canarinho_units", JSON.stringify(units));
    }
  }, [units, mounted]);

  const completeLesson = (lessonId: string) => {
    setUnits((prev) => {
      const newUnits = structuredClone(prev);
      let found = false;
      let nextLessonFound = false;

      for (const unit of newUnits) {
        for (let i = 0; i < unit.lessons.length; i++) {
          const l = unit.lessons[i];
          if (l.id === lessonId) {
            l.status = "done";
            found = true;
          } else if (found && !nextLessonFound) {
            if (l.status === "locked" || l.status === "current") {
              l.status = "current";
              nextLessonFound = true;
            }
          }
        }
      }
      return newUnits;
    });
  };

  const injectRemediation = (tag: string, afterLessonId: string) => {
    setUnits((prev) => {
      const newUnits = structuredClone(prev);
      for (const unit of newUnits) {
        const idx = unit.lessons.findIndex((l) => l.id === afterLessonId);
        if (idx === -1) continue;
        // Avoid double injection
        const alreadyInjected = unit.lessons.some(
          (l) => l.kind === "remediation" && l.tag === tag && l.status !== "done"
        );
        if (alreadyInjected) return prev;
        const ts = Date.now();
        const remLessons: Lesson[] = [
          { id: `rem_${tag}_v_${ts}`,   title: `Reforço: Vídeo sobre ${tag.toUpperCase()}`,     status: "current", kind: "remediation", tag, remediation: { type: "video" } },
          { id: `rem_${tag}_e_${ts+1}`, title: `Reforço: Exemplo de ${tag.toUpperCase()}`,       status: "locked",  kind: "remediation", tag, remediation: { type: "example" } },
          { id: `rem_${tag}_a_${ts+2}`, title: `Reforço: Animação de ${tag.toUpperCase()}`,      status: "locked",  kind: "remediation", tag, remediation: { type: "animation" } },
          { id: `rem_${tag}_x_${ts+3}`, title: `Reforço: Exercício sobre ${tag.toUpperCase()}`,  status: "locked",  kind: "remediation", tag, remediation: { type: "exercise" } },
        ];
        // Lock the original lesson until remediation is done
        unit.lessons[idx].status = "locked";
        // Insert remediation lessons right after the failed lesson
        unit.lessons.splice(idx + 1, 0, ...remLessons);
        return newUnits;
      }
      return prev;
    });
  };

  return { units, completeLesson, setUnits, injectRemediation };
}

/* ---------- Error tracker hook ---------- */

function useErrorTracker() {
  const [errors, setErrors] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("canarinho_errors");
      if (saved) setErrors(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const trackError = (tag: string): number => {
    const next = (errors[tag] || 0) + 1;
    const updated = { ...errors, [tag]: next };
    setErrors(updated);
    localStorage.setItem("canarinho_errors", JSON.stringify(updated));
    return next;
  };

  const resetError = (tag: string) => {
    const updated = { ...errors, [tag]: 0 };
    setErrors(updated);
    localStorage.setItem("canarinho_errors", JSON.stringify(updated));
  };

  return { trackError, resetError };
}

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
          <Globe className="h-4 w-4" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">PT-BR</span>
        </div>
      </div>
    </div>
  );
}

function UnitBanner({ unit, expanded, onToggle }: { unit: Unit; expanded?: boolean; onToggle?: () => void }) {
  const t = unitToken(unit.color);
  return (
    <div
      onClick={onToggle}
      className={`relative mt-6 cursor-pointer overflow-hidden rounded-2xl ${t.banner} px-5 py-4 shadow-[0_4px_0_0_var(--color-primary-shadow)] transition-transform active:scale-[0.99]`}
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
        <div
          className={`shrink-0 rounded-xl border-2 border-white/30 ${t.text} px-3 py-2 text-[0.7rem] font-black uppercase tracking-wider transition hover:bg-white/10`}
        >
          {expanded ? "Ocultar" : "Mostrar"}
        </div>
      </div>
    </div>
  );
}

/* ---------- Unit Section Wrapper ---------- */

function UnitSection({ unit, ui, onPick }: { unit: Unit; ui: number; onPick: (l: Lesson) => void }) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(`canarinho_unit_exp_${unit.id}`);
    if (saved !== null) {
      setExpanded(saved === "true");
    }
  }, [unit.id]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem(`canarinho_unit_exp_${unit.id}`, String(next));
  };

  return (
    <section>
      <UnitBanner unit={unit} expanded={expanded} onToggle={handleToggle} />
      {expanded && (
        <div className="relative mt-6 flex flex-col items-center gap-7 pb-2 animate-in fade-in slide-in-from-top-4 duration-300">
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
                onPick={onPick}
                active={lesson.status === "current"}
              />
            );
          })}
        </div>
      )}
      {ui === 0 && expanded && (
        <MascotTip text="Quando travar no SICAR, eu te mostro a tela exata pra clicar. Bora?" />
      )}
    </section>
  );
}

/* ---------- Lesson node (the round Duolingo button) ---------- */

function lessonIcon(kind: LessonKind, status: LessonStatus) {
  if (status === "locked") return <Lock className="h-8 w-8" />;
  if (kind === "remediation") return <Sparkles className="h-8 w-8" />;
  if (kind === "checkpoint") return <Key className="h-8 w-8" />;
  if (kind === "trophy") return <Trophy className="h-8 w-8" />;
  if (kind === "practice") return <MapPin className="h-8 w-8" />;
  if (kind === "map") return <Map className="h-8 w-8" />;
  return <BookOpen className="h-8 w-8" />;
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

  const isRemediation = lesson.kind === "remediation";

  const baseColor = isRemediation && !isDone
    ? "bg-amber-400"
    : isDone
      ? "bg-primary"
      : isLocked
        ? "bg-muted"
        : t.bg;
  const shadowColor = isRemediation && !isDone
    ? "#92400e"
    : isDone
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
      {isRemediation && isCurrent && (
        <div className="mb-2 rounded-xl border-2 border-amber-600 bg-amber-50 px-3 py-1.5 shadow-[0_3px_0_0_#92400e]">
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-amber-700">Reforço</p>
        </div>
      )}
      {!isRemediation && isCurrent && (
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
        <span className="drop-shadow-sm">{lessonIcon(lesson.kind, lesson.status)}</span>
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
  { id: "trail", icon: <Leaf className="h-6 w-6" />, label: "Trilha" },
  { id: "sicar", icon: <Map className="h-6 w-6" />, label: "SICAR" },
  { id: "profile", icon: <User className="h-6 w-6" />, label: "Perfil" },
];

function SidebarNav({ tab, onTab }: { tab: string; onTab: (v: string) => void }) {
  return (
    <nav className="hidden md:flex w-64 shrink-0 flex-col border-r-2 border-border bg-white px-4 py-8">
      <div className="mb-8 px-2 flex items-center gap-3">
        <Leaf className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-black tracking-tight text-primary">Canarinho</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <li key={n.id}>
              <button
                onClick={() => onTab(n.id)}
                className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-black uppercase tracking-wider transition ${
                  active
                    ? "bg-primary/10 text-primary border-2 border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-muted-foreground border-2 border-transparent grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BottomNav({ tab, onTab }: { tab: string; onTab: (v: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-3 gap-1">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <li key={n.id}>
              <button
                onClick={() => onTab(n.id)}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[0.68rem] font-black uppercase tracking-wider transition ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-muted-foreground grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- Content Tabs ---------- */

function SicarTab() {
  return (
    <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-2xl font-black">Resumo do CAR</h2>
        <p className="text-sm font-bold text-muted-foreground">Sítio Boa Vista</p>
      </div>

      <div className="rounded-2xl border-2 border-border bg-white p-5 shadow-[0_4px_0_0_var(--color-border)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status atual</p>
            <p className="text-lg font-black text-foreground">Em Preenchimento</p>
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[45%] rounded-full bg-primary" />
        </div>
        <p className="mt-2 text-right text-xs font-bold text-muted-foreground">45% concluído</p>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-border bg-white shadow-[0_4px_0_0_var(--color-border)]">
        <div className="flex items-center justify-between border-b-2 border-border bg-muted px-4 py-3">
          <p className="text-sm font-black uppercase tracking-widest text-foreground">Mapa da Propriedade</p>
          <span className="rounded bg-accent/20 px-2 py-1 text-xs font-bold text-accent">Polígono</span>
        </div>
        <div className="relative grid h-48 place-items-center bg-[oklch(0.97_0.02_120)]">
          <p className="text-sm font-bold text-muted-foreground">Abra a Trilha para desenhar no mapa.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-[0_4px_0_0_var(--color-border)]">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Área Total</p>
          <p className="mt-1 text-xl font-black">12.5 ha</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-[0_4px_0_0_var(--color-border)]">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reserva Legal</p>
          <p className="mt-1 text-xl font-black">2.5 ha</p>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col items-center border-b-2 border-border pb-6 pt-4">
        <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-primary bg-primary/5 text-4xl shadow-[0_4px_0_0_var(--color-primary-shadow)] text-primary">
          <User className="h-10 w-10" />
        </div>
        <h2 className="mt-4 text-2xl font-black">Seção do Usuário</h2>
        <p className="text-sm font-bold text-muted-foreground">Seu João · Entrou em Maio/2026</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-[0_4px_0_0_var(--color-border)]">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lições Concluídas</p>
          <p className="mt-1 text-2xl font-black text-primary">3</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-[0_4px_0_0_var(--color-border)]">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dias de Foco</p>
          <p className="mt-1 text-2xl font-black text-orange-500">2</p>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-black">Conquistas</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-white p-4 shadow-[0_4px_0_0_var(--color-border)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-black text-foreground">Primeiro Passo</p>
              <p className="text-xs font-bold text-muted-foreground">Completou a primeira lição do CAR.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-white p-4 shadow-[0_4px_0_0_var(--color-border)] opacity-60">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <Map className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="font-black text-foreground">Mestre do Mapa</p>
              <p className="text-xs font-bold text-muted-foreground">Desenhe todas as áreas exigidas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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

function LessonSheet({ lesson, onClose, onComplete, onOpenAssistant, onError }: { lesson: Lesson; onClose: () => void; onComplete: () => void; onOpenAssistant: () => void; onError?: (tag: string) => void }) {
  const q = QUESTIONS.default;
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [mapDone, setMapDone] = useState<{ ok: boolean; msg: string } | null>(null);

  // Bloqueia o scroll do fundo enquanto o modal está aberto (client-side only)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isMap = lesson.kind === "map" && lesson.map;
  const correct = isMap ? !!mapDone?.ok : checked && picked === q.correct;

  if (isMap && lesson.map) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center">
        <div className="w-full max-w-md md:max-w-3xl overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/60 p-5 animate-in fade-in duration-300">
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex flex-col items-center gap-4 text-center">
                  <img
                    src={mapDone.ok ? canarinhoCelebrate : canarinho}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20"
                  />
                  <div>
                    <p className={`text-xl font-black ${mapDone.ok ? "text-primary" : "text-heart"}`}>
                      {mapDone.msg}
                    </p>
                  </div>
                  {mapDone.ok ? (
                    <button
                      onClick={onComplete}
                      className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-lg font-black uppercase tracking-wider text-primary-foreground active:scale-[0.98] transition-transform"
                      style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
                    >
                      Continuar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onOpenAssistant}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-muted/20 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground transition-colors active:scale-[0.98]"
                      >
                        Ficou com dúvida? Pergunte ao Canarinho
                      </button>
                      <button
                        onClick={() => setMapDone(null)}
                        className="mt-2 w-full rounded-2xl bg-heart py-3.5 text-lg font-black uppercase tracking-wider text-white active:scale-[0.98] transition-transform"
                        style={{ boxShadow: "0 4px 0 0 #ea2b2b" }}
                      >
                        Tentar Novamente
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-stretch justify-end bg-foreground/40 sm:items-center sm:justify-center">
      <div className="flex w-full flex-col sm:max-w-md sm:max-h-[90vh] h-[92vh] sm:h-auto rounded-t-3xl sm:rounded-3xl bg-background overflow-hidden">
        {/* Header progress */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/40 px-5 py-4">
          <button onClick={onClose} aria-label="Fechar" className="text-2xl font-black text-muted-foreground leading-none">
            ×
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/5 rounded-full bg-primary" />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">

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
        </div>
        {/* End scrollable content */}

        {/* Sticky action area */}
        <div className="shrink-0 border-t border-border/40 bg-background px-5 py-4">
          <button
            onClick={() => {
              if (picked === null) return;
              const isCorrect = picked === q.correct;
              setChecked(true);
              if (!isCorrect && lesson.tag) {
                onError?.(lesson.tag);
              }
            }}
            disabled={picked === null || checked}
            className={`w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wider transition ${
              picked === null
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground active:translate-y-0.5"
            }`}
            style={{
              boxShadow: picked === null ? "none" : "0 4px 0 0 var(--color-primary-shadow)",
            }}
          >
            Verificar
          </button>
        </div>

        {/* Centered Feedback Modal */}
        {checked && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/60 p-5 animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col items-center gap-4 text-center">
                <img
                  src={correct ? canarinhoCelebrate : canarinho}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 drop-shadow-sm"
                />
                <div>
                  <p className={`text-2xl font-black ${correct ? "text-primary" : "text-heart"}`}>
                    {correct ? "Boa! Resposta certa." : "Quase!"}
                  </p>
                  <p className="mt-2 text-sm font-bold text-muted-foreground">
                    {correct
                      ? "Você mandou bem, continue assim na trilha do CAR."
                      : "No SICAR, é Cadastrar > Imóvel Rural. Dica: é por essa aba que você inicia todo o desenho do imóvel."}
                  </p>
                </div>
                {!correct && (
                  <button
                    onClick={onOpenAssistant}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-muted/20 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground transition-colors active:scale-[0.98]"
                  >
                    Ficou com dúvida? Pergunte ao Canarinho
                  </button>
                )}
                <button
                  onClick={
                    correct
                      ? onComplete
                      : () => {
                          setChecked(false);
                          setPicked(null);
                        }
                  }
                  className={`mt-3 w-full rounded-2xl py-3.5 text-lg font-black uppercase tracking-wider text-white active:scale-[0.98] transition-transform ${
                    correct ? "bg-primary" : "bg-heart"
                  }`}
                  style={{
                    boxShadow: `0 4px 0 0 ${correct ? "var(--color-primary-shadow)" : "#ea2b2b"}`,
                  }}
                >
                  {correct ? "Continuar" : "Tentar Novamente"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- App shell ---------- */

function App() {
  const [tab, setTab] = useState("trail");
  const [open, setOpen] = useState<Lesson | null>(null);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [adaptiveModal, setAdaptiveModal] = useState<{ tag: string; lessonId: string } | null>(null);
  const { units, completeLesson, setUnits, injectRemediation } = useUnits();
  const { trackError, resetError } = useErrorTracker();

  const totalDone = useMemo(
    () => units.flatMap((u) => u.lessons).filter((l) => l.status === "done").length,
    [units],
  );

  return (
    <div className="min-h-screen bg-background md:bg-[oklch(0.97_0.02_120)] md:py-8">
      {/* App Container */}
      <div className="mx-auto flex min-h-screen w-full flex-col bg-background md:min-h-[85vh] md:max-w-5xl md:flex-row md:overflow-hidden md:rounded-3xl md:border-2 md:border-border md:shadow-2xl">
        
        <SidebarNav tab={tab} onTab={setTab} />

        <div className="flex flex-1 flex-col overflow-y-auto relative">
          <HUD />

          <main className="flex-1 px-5 pb-24 lg:px-8 max-w-2xl mx-auto w-full md:pb-8">
            {tab === "trail" && (
            <>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Trilha do CAR
                  </p>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black leading-tight">
                      Olá, Seu João!
                    </h1>
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
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

              {units.map((unit, ui) => (
                <UnitSection key={unit.id} unit={unit} ui={ui} onPick={setOpen} />
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

          {tab === "sicar" && <SicarTab />}
          {tab === "profile" && <ProfileTab />}
        </main>

          <BottomNav tab={tab} onTab={setTab} />
        </div>
      </div>

      <p className="mx-auto mt-4 hidden md:block max-w-5xl px-5 text-center text-xs font-bold text-muted-foreground">
        Protótipo · Canarinho CAR — trilha de regularização ambiental para produtores rurais
      </p>

      {/* Botão de reset temporário para debug */}
      <button 
        onClick={() => { localStorage.removeItem("canarinho_units"); window.location.reload(); }}
        className="fixed top-4 right-4 z-50 text-[0.6rem] font-bold text-muted-foreground opacity-50 hover:opacity-100"
      >
        Resetar Progresso
      </button>

      {/* Floating Assistant Button */}
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-20 right-5 z-40 md:bottom-8 md:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
      >
        <img src={canarinho} alt="Ajuda" className="h-8 w-8 drop-shadow-sm" />
      </button>

      {/* Main lesson sheet (MCQ or map) */}
      {open && open.kind !== "remediation" && (
        <LessonSheet
          lesson={open}
          onClose={() => setOpen(null)}
          onComplete={() => {
            resetError(open.tag || "geral");
            completeLesson(open.id);
            setOpen(null);
          }}
          onOpenAssistant={() => {
            setOpen(null);
            setAssistantOpen(true);
          }}
          onError={(tag) => {
            const count = trackError(tag);
            if (count >= 3) {
              setOpen(null);
              setAdaptiveModal({ tag, lessonId: open.id });
            }
          }}
        />
      )}

      {/* Remediation sheet */}
      {open && open.kind === "remediation" && (
        <RemediationSheet
          lesson={open}
          onClose={() => setOpen(null)}
          onComplete={() => {
            completeLesson(open.id);
            setOpen(null);
          }}
        />
      )}

      {/* Adaptive trail modal */}
      {adaptiveModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-foreground/60 p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-5 text-center">
              <img
                src={canarinho}
                alt="Canarinho"
                className="mx-auto h-20 w-20 drop-shadow-lg animate-bounce"
              />
            </div>
            <div className="px-6 py-5 text-center flex flex-col gap-4">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-amber-600">
                  Trilha Adaptativa Ativada!
                </p>
                <h3 className="mt-1 text-xl font-black text-foreground">
                  Notei que você teve dificuldade!
                </h3>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  Preparei <span className="font-black text-amber-600">4 lições especiais</span> sobre{" "}
                  <span className="font-black text-foreground">{adaptiveModal.tag.toUpperCase()}</span> para te ajudar antes de continuar.
                </p>
              </div>
              {/* Mini trail preview */}
              <div className="flex items-center justify-center gap-2">
                {(["Vídeo", "Exemplo", "Animação", "Exercício"] as const).map((type, i) => (
                  <div key={type} className="flex flex-col items-center gap-1">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                      {["🎬", "📖", "✨", "📝"][i]}
                    </div>
                    <span className="text-[0.55rem] font-black text-amber-700">{type}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  injectRemediation(adaptiveModal.tag, adaptiveModal.lessonId);
                  setAdaptiveModal(null);
                }}
                className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-black uppercase tracking-wider text-white"
                style={{ boxShadow: "0 4px 0 0 #92400e" }}
              >
                Vamos lá! →
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssistantOpen && <AssistantChat onClose={() => setAssistantOpen(false)} />}
    </div>
  );
}
