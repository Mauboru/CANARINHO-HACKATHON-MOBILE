import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import * as turf from "@turf/turf";
import { SAMPLE_PROPERTY } from "@/lib/sample-property";
import { Leaf, MapPin, Target } from "lucide-react";

export type MapMode = "polygon" | "point" | "line" | "buffer";
export type Tolerance = "easy" | "normal" | "strict";

interface Props {
  lessonId: string;
  mode: MapMode;
  gabarito: [number, number][] | [number, number];
  baseLine?: [number, number][];
  bufferMeters?: number;
  instruction: string;
  onResult: (ok: boolean, message: string) => void;
}

const STORAGE_PREFIX = "canarinho:map:";
const TOL_KEY = "canarinho:map:tolerance";

// Thresholds tuned per mode. Higher = more forgiving.
const THRESHOLDS: Record<
  Tolerance,
  { iouOk: number; iouClose: number; pointMeters: number; lineRatio: number; bufferIou: number; label: string; icon: React.ReactNode }
> = {
  easy:   { iouOk: 0.55, iouClose: 0.25, pointMeters: 70, lineRatio: 0.55, bufferIou: 0.45, label: "Fácil",   icon: <Leaf className="h-3 w-3" /> },
  normal: { iouOk: 0.70, iouClose: 0.40, pointMeters: 40, lineRatio: 0.70, bufferIou: 0.60, label: "Normal",  icon: <MapPin className="h-3 w-3" /> },
  strict: { iouOk: 0.85, iouClose: 0.60, pointMeters: 20, lineRatio: 0.85, bufferIou: 0.75, label: "Rigoroso", icon: <Target className="h-3 w-3" /> },
};

export default function MapLesson({
  lessonId,
  mode,
  gabarito,
  baseLine,
  bufferMeters = 30,
  instruction,
  onResult,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawLayerRef = useRef<L.FeatureGroup | null>(null);
  const hintLayerRef = useRef<L.FeatureGroup | null>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string; hints?: string[] } | null>(null);
  const [tolerance, setTolerance] = useState<Tolerance>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOL_KEY) : null;
    return (saved as Tolerance) || "normal";
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(TOL_KEY, tolerance);
  }, [tolerance]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, {
      center: SAMPLE_PROPERTY.center,
      zoom: SAMPLE_PROPERTY.zoom,
      zoomControl: true,
    });
    mapRef.current = map;

    const sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Imagem &copy; Esri, Maxar, Earthstar Geographics" },
    ).addTo(map);

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    });

    L.control.layers({ Satélite: sat, "Mapa de ruas": osm }, undefined, { position: "topright" }).addTo(map);

    const hintLayer = new L.FeatureGroup().addTo(map);
    hintLayerRef.current = hintLayer;

    const drawLayer = new L.FeatureGroup().addTo(map);
    drawLayerRef.current = drawLayer;

    map.pm.addControls({
      position: "topleft",
      drawMarker: mode === "point",
      drawCircleMarker: false,
      drawPolyline: mode === "line",
      drawRectangle: false,
      drawPolygon: mode === "polygon" || mode === "buffer",
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });
    map.pm.setPathOptions({ color: "#2d8a3e", fillColor: "#52c466", fillOpacity: 0.35, weight: 3 });

    const saved = localStorage.getItem(STORAGE_PREFIX + lessonId);
    if (saved) {
      try {
        const gj = JSON.parse(saved);
        L.geoJSON(gj).eachLayer((l) => drawLayer.addLayer(l));
        setHasDrawing(true);
      } catch { /* ignore */ }
    }

    if (mode === "buffer" && baseLine) {
      const riverLine = L.polyline(
        baseLine.map(([lng, lat]) => [lat, lng] as [number, number]),
        { color: "#1d6fb8", weight: 4, dashArray: "6 6" },
      ).addTo(map);
      riverLine.bindTooltip("Rio (margem)", { permanent: true, direction: "top", className: "!bg-white !text-xs !font-bold" });
    }

    const clearHints = () => hintLayerRef.current?.clearLayers();

    const onCreate = (e: { layer: L.Layer }) => {
      drawLayer.addLayer(e.layer);
      setHasDrawing(true);
      clearHints();
      setFeedback(null);
      persist();
    };
    const onEdit = () => { clearHints(); setFeedback(null); persist(); };
    const onRemove = () => {
      persist();
      setHasDrawing(drawLayer.getLayers().length > 0);
      clearHints();
      setFeedback(null);
    };

    map.on("pm:create", onCreate);
    map.on("pm:edit", onEdit);
    map.on("pm:remove", onRemove);

    function persist() {
      const gj = drawLayer.toGeoJSON();
      localStorage.setItem(STORAGE_PREFIX + lessonId, JSON.stringify(gj));
    }

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, mode]);

  function showGabaritoOutline(coords: [number, number][], color = "#ffb020") {
    const layer = L.polygon(
      coords.map(([lng, lat]) => [lat, lng] as [number, number]),
      { color, weight: 3, dashArray: "8 6", fill: false },
    );
    hintLayerRef.current?.addLayer(layer);
    layer.bindTooltip("Gabarito esperado", { permanent: false, direction: "top" });
  }

  function showDiffPolygon(
    poly: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
    color: string,
    label: string,
  ) {
    const layer = L.geoJSON(poly, {
      style: { color, fillColor: color, fillOpacity: 0.35, weight: 2, dashArray: "4 4" },
    });
    layer.bindTooltip(label, { sticky: true });
    hintLayerRef.current?.addLayer(layer);
  }

  function showPointHint(target: [number, number], user: [number, number]) {
    const line = L.polyline(
      [[user[1], user[0]], [target[1], target[0]]],
      { color: "#ef4444", weight: 3, dashArray: "6 4" },
    );
    const marker = L.circleMarker([target[1], target[0]], {
      radius: 10,
      color: "#ffb020",
      fillColor: "#ffb020",
      fillOpacity: 0.6,
      weight: 3,
    }).bindTooltip("Posição correta", { permanent: true, direction: "top" });
    hintLayerRef.current?.addLayer(line);
    hintLayerRef.current?.addLayer(marker);
  }

  function showLineHint(coords: [number, number][]) {
    const layer = L.polyline(
      coords.map(([lng, lat]) => [lat, lng] as [number, number]),
      { color: "#ffb020", weight: 4, dashArray: "8 6" },
    ).bindTooltip("Traçado esperado", { permanent: false });
    hintLayerRef.current?.addLayer(layer);
  }

  function check() {
    const layer = drawLayerRef.current;
    hintLayerRef.current?.clearLayers();
    if (!layer || layer.getLayers().length === 0) {
      const r = { ok: false, msg: "Desenhe no mapa primeiro." };
      setFeedback(r); onResult(false, r.msg); return;
    }
    const t = THRESHOLDS[tolerance];
    const gj = layer.toGeoJSON() as GeoJSON.FeatureCollection;
    const f = gj.features[0];
    let ok = false;
    let msg = "";
    const hints: string[] = [];

    if (mode === "polygon") {
      const gabCoords = gabarito as [number, number][];
      const gab = turf.polygon([gabCoords]);
      const usr = f.geometry.type === "Polygon" ? turf.polygon((f.geometry as GeoJSON.Polygon).coordinates) : null;
      if (!usr) {
        msg = "Use a ferramenta de polígono pra fechar o contorno.";
      } else {
        const inter = turf.intersect(turf.featureCollection([gab, usr]));
        const union = turf.union(turf.featureCollection([gab, usr]));
        const iou = inter && union ? turf.area(inter) / turf.area(union) : 0;
        const areaUsr = turf.area(usr) / 10000;
        const areaGab = turf.area(gab) / 10000;
        if (iou >= t.iouOk) {
          ok = true;
          msg = `Perfeito! ${areaUsr.toFixed(2)} ha · acerto ${(iou * 100).toFixed(0)}% (mín. ${(t.iouOk * 100).toFixed(0)}%).`;
        } else {
          msg = iou >= t.iouClose
            ? `Quase lá — ${(iou * 100).toFixed(0)}% de acerto (precisa ${(t.iouOk * 100).toFixed(0)}%).`
            : `Fora do limite — só ${(iou * 100).toFixed(0)}% de sobreposição.`;
          // Visual hints
          showGabaritoOutline(gabCoords);
          try {
            const missing = turf.difference(turf.featureCollection([gab, usr]));
            if (missing) {
              showDiffPolygon(missing as any, "#ef4444", "Faltou cobrir esta parte");
              hints.push("Vermelho: áreas do imóvel que ficaram de fora.");
            }
          } catch { /* ignore */ }
          try {
            const extra = turf.difference(turf.featureCollection([usr, gab]));
            if (extra) {
              showDiffPolygon(extra as any, "#f59e0b", "Você incluiu além do limite");
              hints.push("Laranja: áreas que você incluiu além da cerca.");
            }
          } catch { /* ignore */ }
          if (areaUsr > areaGab * 1.15) hints.push(`Sua área (${areaUsr.toFixed(1)} ha) é maior que o esperado (${areaGab.toFixed(1)} ha).`);
          else if (areaUsr < areaGab * 0.85) hints.push(`Sua área (${areaUsr.toFixed(1)} ha) é menor que o esperado (${areaGab.toFixed(1)} ha).`);
        }
      }
    } else if (mode === "point") {
      const usr = f.geometry as GeoJSON.Point;
      const [lng, lat] = usr.coordinates;
      const [glng, glat] = gabarito as [number, number];
      const dist = turf.distance([lng, lat], [glng, glat], { units: "meters" });
      if (dist <= t.pointMeters) {
        ok = true;
        msg = `Boa! ${dist.toFixed(0)} m do alvo (limite ${t.pointMeters} m).`;
      } else {
        msg = `Está a ${dist.toFixed(0)} m — precisa ficar a até ${t.pointMeters} m.`;
        showPointHint([glng, glat], [lng, lat]);
        hints.push("Marcador amarelo: posição correta. Linha tracejada mostra o quanto mover.");
      }
    } else if (mode === "line") {
      const gabCoords = gabarito as [number, number][];
      const gab = turf.lineString(gabCoords);
      const usr = turf.lineString((f.geometry as GeoJSON.LineString).coordinates);
      const len = turf.length(usr, { units: "meters" });
      const gabLen = turf.length(gab, { units: "meters" });
      const ratio = Math.min(len, gabLen) / Math.max(len, gabLen);
      if (ratio >= t.lineRatio) {
        ok = true;
        msg = `Servidão marcada (${len.toFixed(0)} m). Boa!`;
      } else {
        msg = `Comprimento fora: ${len.toFixed(0)} m vs ${gabLen.toFixed(0)} m esperados.`;
        showLineHint(gabCoords);
        hints.push("Linha tracejada: traçado esperado. Siga a estrada na imagem.");
      }
    } else if (mode === "buffer" && baseLine) {
      const line = turf.lineString(baseLine);
      const auto = turf.buffer(line, bufferMeters, { units: "meters" });
      const usr = f.geometry.type === "Polygon" ? turf.polygon((f.geometry as GeoJSON.Polygon).coordinates) : null;
      if (!usr || !auto) {
        msg = "Desenhe um polígono cobrindo a faixa às margens do rio.";
      } else {
        const inter = turf.intersect(turf.featureCollection([auto as any, usr]));
        const iou = inter ? turf.area(inter) / turf.area(auto as any) : 0;
        if (iou >= t.bufferIou) {
          ok = true;
          msg = `Faixa de APP de ${bufferMeters} m bem coberta (${(iou * 100).toFixed(0)}%)!`;
        } else {
          msg = `Sua faixa cobre só ${(iou * 100).toFixed(0)}% da APP (mín. ${(t.bufferIou * 100).toFixed(0)}%).`;
          const autoLayer = L.geoJSON(auto as any, {
            style: { color: "#ffb020", weight: 2, dashArray: "6 4", fillColor: "#ffb020", fillOpacity: 0.2 },
          }).bindTooltip(`APP de ${bufferMeters} m`);
          hintLayerRef.current?.addLayer(autoLayer);
          hints.push("Faixa amarela: APP esperada ao redor do rio.");
        }
      }
    }

    const r = { ok, msg, hints: hints.length ? hints : undefined };
    setFeedback(r);
    onResult(ok, msg);
  }

  function clear() {
    drawLayerRef.current?.clearLayers();
    hintLayerRef.current?.clearLayers();
    localStorage.removeItem(STORAGE_PREFIX + lessonId);
    setHasDrawing(false);
    setFeedback(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border-2 border-border bg-accent/15 px-3 py-2">
        <p className="text-xs font-extrabold uppercase tracking-wider text-accent-shadow">Missão no mapa</p>
        <p className="text-sm font-bold leading-snug text-foreground">{instruction}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Tolerância:</span>
        {(Object.keys(THRESHOLDS) as Tolerance[]).map((k) => {
          const active = tolerance === k;
          return (
            <button
              key={k}
              onClick={() => { setTolerance(k); setFeedback(null); hintLayerRef.current?.clearLayers(); }}
              className="rounded-full border-2 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider transition"
              style={{
                borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                background: active ? "var(--color-primary)" : "white",
                color: active ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              <span className="flex items-center gap-1.5">{THRESHOLDS[k].icon} {THRESHOLDS[k].label}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={ref}
        className="h-[340px] w-full overflow-hidden rounded-2xl border-2 border-border shadow-[0_3px_0_0_var(--color-border)]"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={clear}
          className="rounded-xl border-2 border-border bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground"
        >
          Limpar
        </button>
        <button
          onClick={check}
          disabled={!hasDrawing}
          className="flex-1 rounded-xl py-2.5 text-sm font-black uppercase tracking-wider transition disabled:bg-muted disabled:text-muted-foreground"
          style={{
            background: hasDrawing ? "var(--color-primary)" : undefined,
            color: hasDrawing ? "var(--color-primary-foreground)" : undefined,
            boxShadow: hasDrawing ? "0 4px 0 0 var(--color-primary-shadow)" : "none",
          }}
        >
          Verificar desenho
        </button>
      </div>

      {feedback && (
        <div
          className="rounded-lg px-3 py-2 text-xs font-bold leading-snug"
          style={{
            background: feedback.ok ? "color-mix(in srgb, var(--color-primary) 15%, white)" : "color-mix(in srgb, var(--color-heart) 12%, white)",
            color: "var(--color-foreground)",
            border: `2px solid ${feedback.ok ? "var(--color-primary)" : "var(--color-heart)"}`,
          }}
        >
          <p>{feedback.msg}</p>
          {feedback.hints && (
            <ul className="mt-1.5 space-y-0.5 text-[0.7rem] font-semibold text-muted-foreground">
              {feedback.hints.map((h, i) => <li key={i}>• {h}</li>)}
            </ul>
          )}
        </div>
      )}

      <p className="text-[0.65rem] font-bold text-muted-foreground">
        Imagem: Esri World Imagery · Mapa base: OpenStreetMap · Desenhos salvos no aparelho.
      </p>
    </div>
  );
}
