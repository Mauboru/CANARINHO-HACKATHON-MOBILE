import { useEffect, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import canarinho from "@/assets/canarinho.png";

type RemediationType = "video" | "example" | "animation" | "exercise";

interface RemediationLesson {
  id: string;
  title: string;
  tag?: string;
  remediation?: { type: RemediationType };
}

interface Props {
  lesson: RemediationLesson;
  onClose: () => void;
  onComplete: () => void;
}

// ── Content per tag ─────────────────────────────────────────────────────────
const CONTENT: Record<
  string,
  {
    video: { youtubeId: string; title: string; description: string };
    example: { title: string; text: string; correct: string; wrong: string };
    animation: { title: string; description: string };
    exercise: { prompt: string; options: string[]; correct: number };
  }
> = {
  sicar: {
    video: {
      youtubeId: "GNRdpTSRemo",
      title: "Como navegar no SICAR Desktop",
      description:
        "Neste vídeo você aprende passo a passo como abrir e navegar nas abas do SICAR para cadastrar seu imóvel rural.",
    },
    example: {
      title: "Qual aba usar no SICAR?",
      text: "Para cadastrar um novo imóvel rural no SICAR, você deve usar a aba 'Cadastrar'. A aba 'Retificar' existe apenas para corrigir cadastros que já existem — não use-a para um imóvel novo.",
      correct: "Cadastrar > Imóvel Rural — para novos cadastros.",
      wrong: "Retificar > Imóvel — somente para corrigir cadastros existentes.",
    },
    animation: {
      title: "Caminho correto no menu do SICAR",
      description: "Acompanhe a animação e veja exatamente onde clicar.",
    },
    exercise: {
      prompt: "Se você está cadastrando um imóvel pela PRIMEIRA VEZ no SICAR, qual aba deve usar?",
      options: [
        "Cadastrar > Imóvel Rural",
        "Retificar > Imóvel",
        "Consultar > CAR emitido",
        "Configurações > Sistema",
      ],
      correct: 0,
    },
  },
  app: {
    video: {
      youtubeId: "ZXZovUSUbfQ",
      title: "APP — Área de Preservação Permanente no CAR",
      description:
        "Entenda o que é APP, quais são as faixas de proteção obrigatórias e como demarcá-las no SICAR.",
    },
    example: {
      title: "APP na prática",
      text: "A APP (Área de Preservação Permanente) é a faixa de mata que deve ser preservada ao longo das margens dos rios, nascentes e topos de morro. Para rios de até 10 metros de largura, a faixa mínima obrigatória é de 30 metros em cada margem.",
      correct: "Faixa de 30m de mata nativa preservada em cada margem do rio.",
      wrong: "Pasto ou plantio chegando até a beira do rio, sem vegetação nativa.",
    },
    animation: {
      title: "Faixa de APP ao redor do rio",
      description: "Veja como a APP deve ser demarcada na sua propriedade.",
    },
    exercise: {
      prompt: "Para rios com até 10 metros de largura, a faixa mínima de APP em cada margem é de:",
      options: ["30 metros", "50 metros", "15 metros", "100 metros"],
      correct: 0,
    },
  },
  geral: {
    video: {
      youtubeId: "GNRdpTSRemo",
      title: "Entendendo o Cadastro Ambiental Rural (CAR)",
      description:
        "Reforce seus conhecimentos sobre o que é o CAR e por que ele é obrigatório para todos os produtores.",
    },
    example: {
      title: "O CAR em resumo",
      text: "O CAR é obrigatório para todos os imóveis rurais. Sem ele, o produtor pode ter restrições no acesso a crédito rural e correr risco de multa. O prazo de regularização foi estabelecido pelo Código Florestal (Lei 12.651/2012).",
      correct: "Cadastrar a propriedade corretamente no SICAR para regularizar a situação.",
      wrong: "Deixar sem cadastrar e arriscar multas e restrições de crédito rural.",
    },
    animation: {
      title: "Fluxo do CAR passo a passo",
      description: "Acompanhe as etapas para regularizar sua propriedade.",
    },
    exercise: {
      prompt: "O CAR (Cadastro Ambiental Rural) é:",
      options: [
        "Obrigatório para todos os imóveis rurais",
        "Opcional para imóveis abaixo de 4 módulos fiscais",
        "Somente para grandes fazendas acima de 1000 ha",
        "Voluntário e sem prazo definido",
      ],
      correct: 0,
    },
  },
};

// ── APP Buffer Animation ──────────────────────────────────────────────────
function AppAnimation({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Aqui está o rio que corta sua propriedade.",
    "A APP começa exatamente na margem do rio.",
    "A faixa obrigatória é de 30 metros em cada margem.",
    "Essa área deve ter mata nativa preservada — é proibido plantar ou criar gado aqui!",
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Diagram */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-border" style={{ height: 220 }}>
        {/* Land */}
        <div className="absolute inset-0" style={{ background: "oklch(0.88 0.05 140)" }} />
        {/* APP zone */}
        {step >= 2 && (
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 animate-in fade-in duration-500"
            style={{ width: "55%", background: "oklch(0.72 0.14 140 / 0.55)" }}
          />
        )}
        {/* River */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2"
          style={{ width: "10%", background: "oklch(0.55 0.12 240)" }}
        />
        {/* Trees */}
        {step >= 3 && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-around animate-in fade-in zoom-in-75 duration-500" style={{ width: "52%" }}>
            {["🌳", "🌿", "🌳", "🌿", "🌳", "🌿", "🌳"].map((t, i) => (
              <span key={i} style={{ fontSize: 22 }}>{t}</span>
            ))}
          </div>
        )}
        {/* Labels */}
        {step >= 2 && (
          <>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="rounded-lg bg-white/90 px-2 py-1 text-[0.65rem] font-black text-primary shadow">
                ← 30m
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="rounded-lg bg-white/90 px-2 py-1 text-[0.65rem] font-black text-primary shadow">
                30m →
              </div>
            </div>
          </>
        )}
        {/* River label */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-black text-blue-700 shadow">
            Rio
          </span>
        </div>
        {/* APP label */}
        {step >= 2 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 animate-in fade-in duration-500">
            <span className="rounded-full bg-primary/90 px-3 py-0.5 text-[0.65rem] font-black text-white shadow">
              Área de APP
            </span>
          </div>
        )}
      </div>

      {/* Step text */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm font-bold text-foreground">{steps[step]}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : "w-2 bg-muted"}`}
          />
        ))}
      </div>

      {step < steps.length - 1 ? (
        <button
          onClick={() => setStep((s) => s + 1)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground"
          style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
        >
          Próximo →
        </button>
      ) : (
        <button
          onClick={onDone}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground"
          style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
        >
          Entendi! Continuar ✓
        </button>
      )}
    </div>
  );
}

// ── SICAR Menu Animation ──────────────────────────────────────────────────
function SicarAnimation({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Abra o SICAR Desktop no seu computador.",
    "No menu superior, localize e clique na aba 'Cadastrar'.",
    "Dentro de 'Cadastrar', clique em 'Imóvel Rural'.",
    "O formulário de novo imóvel será aberto. Preencha os dados!",
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Mock SICAR UI */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-white">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 bg-[oklch(0.88_0.02_220)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="ml-2 text-[0.65rem] font-bold text-muted-foreground">SICAR · Sistema Nacional</span>
        </div>
        {/* Menu bar */}
        <div className="flex border-b border-border bg-[oklch(0.96_0.01_220)] text-[0.7rem] font-bold">
          {["Cadastrar", "Retificar", "Consultar", "Enviar"].map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 transition-all ${
                step >= 1 && i === 0
                  ? "bg-primary text-white"
                  : "text-muted-foreground"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        {/* Dropdown */}
        {step >= 2 && (
          <div className="border-b border-border bg-white px-3 py-1.5 animate-in slide-in-from-top-2 duration-300">
            <div className="inline-flex rounded-lg bg-primary/10 px-3 py-1.5">
              <span className="text-[0.7rem] font-black text-primary">▶ Imóvel Rural</span>
            </div>
          </div>
        )}
        {/* Content area */}
        <div
          className="grid place-items-center bg-[oklch(0.97_0.01_220)] p-6 text-[0.7rem] text-muted-foreground"
          style={{ minHeight: 70 }}
        >
          {step < 2
            ? "..."
            : step === 2
            ? "Carregando formulário..."
            : "✓ Formulário de Imóvel Rural aberto!"}
        </div>
      </div>

      {/* Step text */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm font-bold text-foreground">{steps[step]}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : "w-2 bg-muted"}`}
          />
        ))}
      </div>

      {step < steps.length - 1 ? (
        <button
          onClick={() => setStep((s) => s + 1)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground"
          style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
        >
          Próximo →
        </button>
      ) : (
        <button
          onClick={onDone}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground"
          style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
        >
          Entendi! Continuar ✓
        </button>
      )}
    </div>
  );
}

// ── Generic step animation ────────────────────────────────────────────────
function GenericAnimation({ onDone }: { onDone: () => void }) {
  const steps = [
    { icon: "📋", text: "Reúna todos os documentos da propriedade antes de começar." },
    { icon: "🌐", text: "Acesse o SICAR Desktop instalado no seu computador." },
    { icon: "✏️", text: "Preencha o formulário com os dados do imóvel." },
    { icon: "🗺️", text: "Faça o desenho do perímetro usando as ferramentas do mapa." },
    { icon: "✅", text: "Envie e aguarde a confirmação do CAR!" },
  ];
  const [step, setStep] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Stepper */}
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-300 ${
              i === step
                ? "border-primary bg-primary/5 shadow-[0_3px_0_0_var(--color-primary-shadow)]"
                : i < step
                ? "border-primary/30 bg-primary/5 opacity-70"
                : "border-border bg-muted/30 opacity-40"
            }`}
          >
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <p className="text-sm font-bold text-foreground">{s.text}</p>
            {i < step && <span className="ml-auto text-primary font-black">✓</span>}
          </div>
        ))}
      </div>

      {step < steps.length - 1 ? (
        <button
          onClick={() => setStep((s) => s + 1)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground"
          style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
        >
          Próximo →
        </button>
      ) : (
        <button
          onClick={onDone}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground"
          style={{ boxShadow: "0 4px 0 0 var(--color-primary-shadow)" }}
        >
          Entendi! Continuar ✓
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function RemediationSheet({ lesson, onClose, onComplete }: Props) {
  const tag = lesson.tag || "geral";
  const type = lesson.remediation?.type || "video";
  const content = CONTENT[tag] ?? CONTENT.geral;

  const [exercisePicked, setExercisePicked] = useState<number | null>(null);
  const [exerciseChecked, setExerciseChecked] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const headerGradients: Record<RemediationType, string> = {
    video: "from-blue-500 to-blue-700",
    example: "from-amber-500 to-amber-700",
    animation: "from-emerald-500 to-emerald-700",
    exercise: "from-purple-500 to-purple-700",
  };

  const headerShadows: Record<RemediationType, string> = {
    video: "#1e3a8a",
    example: "#92400e",
    animation: "#064e3b",
    exercise: "#3b0764",
  };

  const headerTitles: Record<RemediationType, string> = {
    video: "Reforço em Vídeo",
    example: "Ver um Exemplo",
    animation: "Animação Explicativa",
    exercise: "Novo Exercício",
  };

  const exerciseCorrect = exercisePicked === content.exercise.correct;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-stretch justify-end bg-foreground/40 sm:items-center sm:justify-center">
      <div
        className="flex w-full flex-col sm:max-w-md sm:max-h-[90vh] h-[92vh] sm:h-auto rounded-t-3xl sm:rounded-3xl bg-background overflow-hidden"
        style={{ boxShadow: "0 -8px 40px 0 rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div
          className={`shrink-0 flex items-center justify-between px-5 py-5 bg-gradient-to-r ${headerGradients[type]} text-white`}
          style={{ boxShadow: `0 4px 0 0 ${headerShadows[type]}` }}
        >
          <div>
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] opacity-80">
              Trilha Adaptativa · Reforço
            </p>
            <h2 className="mt-0.5 text-lg font-black">{headerTitles[type]}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Canarinho tip strip */}
        <div className="shrink-0 flex items-center gap-3 border-b border-border/40 bg-muted/30 px-5 py-3">
          <img src={canarinho} alt="Canarinho" className="h-8 w-8 drop-shadow-sm" />
          <p className="text-xs font-bold text-muted-foreground">
            Preparei este material especialmente para você!
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── VIDEO ── */}
          {type === "video" && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-black">{content.video.title}</h3>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{content.video.description}</p>
              </div>
              <div className="aspect-video overflow-hidden rounded-2xl border-2 border-border bg-muted">
                <iframe
                  src={`https://www.youtube.com/embed/${content.video.youtubeId}?rel=0&modestbranding=1`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button
                onClick={onComplete}
                className="w-full rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white"
                style={{ background: "#3b82f6", boxShadow: "0 4px 0 0 #1e40af" }}
              >
                Assisti! Continuar →
              </button>
            </div>
          )}

          {/* ── EXAMPLE ── */}
          {type === "example" && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-black">{content.example.title}</h3>
              <p className="text-sm font-semibold leading-relaxed text-foreground">{content.example.text}</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-[0.65rem] font-black uppercase tracking-widest text-primary">Certo ✓</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{content.example.correct}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="text-[0.65rem] font-black uppercase tracking-widest text-destructive">Errado ✗</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{content.example.wrong}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onComplete}
                className="w-full rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white"
                style={{ background: "#f59e0b", boxShadow: "0 4px 0 0 #92400e" }}
              >
                Entendido! Continuar →
              </button>
            </div>
          )}

          {/* ── ANIMATION ── */}
          {type === "animation" && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-black">{content.animation.title}</h3>
              <p className="text-sm font-semibold text-muted-foreground">{content.animation.description}</p>
              {tag === "app" ? (
                <AppAnimation onDone={onComplete} />
              ) : tag === "sicar" ? (
                <SicarAnimation onDone={onComplete} />
              ) : (
                <GenericAnimation onDone={onComplete} />
              )}
            </div>
          )}

          {/* ── EXERCISE ── */}
          {type === "exercise" && (
            <div className="flex flex-col gap-4">
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
                Exercício de Reforço
              </p>
              <h3 className="text-base font-black leading-snug">{content.exercise.prompt}</h3>
              <div className="flex flex-col gap-2">
                {content.exercise.options.map((opt, i) => {
                  const sel = exercisePicked === i;
                  const correctOpt = exerciseChecked && i === content.exercise.correct;
                  const wrongPicked = exerciseChecked && sel && i !== content.exercise.correct;
                  return (
                    <button
                      key={opt}
                      onClick={() => !exerciseChecked && setExercisePicked(i)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition ${
                        correctOpt
                          ? "border-primary bg-primary/10 text-primary"
                          : wrongPicked
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : sel
                          ? "border-primary bg-primary/5"
                          : "border-border bg-white"
                      }`}
                      style={{
                        boxShadow: sel
                          ? "0 3px 0 0 var(--color-primary-shadow)"
                          : "0 3px 0 0 var(--color-border)",
                      }}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-current text-xs font-black">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {!exerciseChecked ? (
                <button
                  onClick={() => exercisePicked !== null && setExerciseChecked(true)}
                  disabled={exercisePicked === null}
                  className="w-full rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                  style={
                    exercisePicked !== null
                      ? {
                          background: "var(--color-primary)",
                          boxShadow: "0 4px 0 0 var(--color-primary-shadow)",
                        }
                      : undefined
                  }
                >
                  Verificar
                </button>
              ) : (
                <button
                  onClick={
                    exerciseCorrect
                      ? onComplete
                      : () => {
                          setExerciseChecked(false);
                          setExercisePicked(null);
                        }
                  }
                  className={`w-full rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider text-white ${
                    exerciseCorrect ? "bg-primary" : "bg-destructive"
                  }`}
                  style={{
                    boxShadow: `0 4px 0 0 ${exerciseCorrect ? "var(--color-primary-shadow)" : "#991b1b"}`,
                  }}
                >
                  {exerciseCorrect ? "Correto! Continuar →" : "Tentar Novamente"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
