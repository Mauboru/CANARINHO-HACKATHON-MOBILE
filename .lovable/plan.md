## Ideia

Trocar as lições "estáticas" da Unidade 2 por um **mini-mapa interativo real**, onde o produtor desenha o perímetro do imóvel, marca a sede, áreas consolidadas e APP (faixas de rio / nascentes) — exatamente como ele faria depois no SICAR Desktop. Isso transforma a trilha de "quiz" em "treino prático" usando a propriedade real dele.

## Opções de mapa (todas com camada gratuita)

| Opção | Custo | Imagem de satélite | Bom para |
|---|---|---|---|
| **Leaflet + Esri World Imagery (tiles)** | **Gratuito**, sem chave | Sim, atualizada periodicamente pela Esri | Recomendado — é o que o próprio SICAR usa de base |
| **MapLibre GL + tiles MapTiler / Maptiler Satellite** | Free tier 100k tiles/mês, depois pago | Sim | Visual mais moderno (vetorial) |
| **Google Maps / Earth Engine** | Pago após cota baixa, exige cartão | Sim, melhor qualidade | Evitar no protótipo |
| **Mapbox** | Free tier generoso mas exige cartão | Sim | Alternativa ao MapLibre |

**Recomendação:** **Leaflet + Esri World Imagery + Leaflet-Geoman** (desenho de polígonos/pontos). Tudo open-source, sem chave, sem cartão. Os tiles da Esri são os mesmos usados como referência em muitos sistemas ambientais brasileiros. Para limites municipais/estaduais oficiais, dá para sobrepor camadas WMS gratuitas do **IBGE** e do **MapBiomas** (uso e cobertura do solo, atualizado anualmente — perfeito para "espelhar" a realidade da propriedade).

## Como ficaria na trilha (UX)

Dentro do `LessonSheet`, quando a lição for do tipo "mapa" (perímetro, sede, APP, RL), em vez do mock-SICAR + alternativas A/B/C/D:

1. **Topo:** o canarinho explica a missão ("Desenhe o contorno da sua propriedade seguindo as cercas que aparecem na imagem de satélite").
2. **Mapa:** Leaflet ocupando ~60% da altura, centralizado em coordenadas configuráveis (lat/lng iniciais do produtor; no protótipo, um sítio-exemplo).
3. **Ferramentas:** botões grandes estilo Duolingo — "Desenhar perímetro" (polígono), "Marcar sede" (ponto), "Marcar nascente" (ponto), "Desfazer", "Limpar".
4. **Camadas alternáveis:** Satélite (Esri) / Híbrido (satélite + ruas OSM) / Uso do solo (MapBiomas WMS).
5. **Validação leve (gamificação):** comparamos o polígono desenhado com um "gabarito" pré-definido para o sítio-exemplo:
   - área dentro de ±15% → ✅ "Perfeito!"
   - sobreposição (IoU) > 70% → ✅
   - senão → o canarinho dá uma dica ("Sua cerca passou do rio — lembre que o limite é a margem")
6. **Recompensa:** sementes (🌽) + XP, igual às outras lições.
7. **Persistência (protótipo):** desenhos salvos em `localStorage` por lição, para o produtor revisitar.

## Lições da Unidade 2 que viram mapa

- `l6` Perímetro do imóvel → desenhar polígono
- `l7` Marcando a sede → colocar 1 ponto
- `l8` Área consolidada → desenhar polígono interno
- `l9` Servidão e estradas → desenhar linha
- Unidade 3: `l12` Mata ciliar → o app gera buffer automático de 30 m em torno do rio desenhado e o produtor confirma

## Implementação técnica

**Dependências novas:**
- `leaflet` + `@types/leaflet`
- `@geoman-io/leaflet-geoman-free` (ferramentas de desenho: polígono, ponto, linha, edição)
- `@turf/turf` (cálculo de área, buffer de APP, interseção/IoU para validar gabarito)

**Arquivos:**
- `src/components/MapLesson.tsx` — componente novo, recebe `{ mode: 'polygon'|'point'|'line', gabarito?, onComplete }`. Inicializa Leaflet, adiciona camadas (Esri Imagery, OSM, MapBiomas WMS), monta Geoman, calcula validação via turf no submit.
- `src/lib/sample-property.ts` — coordenadas do sítio-exemplo + gabaritos (perímetro, sede, nascente, rio).
- `src/routes/index.tsx` — adicionar campo `kind: 'map'` no tipo `Lesson`, marcar lições l6–l9 como `map`, e no `LessonSheet` renderizar `<MapLesson/>` quando `lesson.kind === 'map'` (mantendo o fluxo quiz para as demais).
- `src/styles.css` — `@import 'leaflet/dist/leaflet.css';` no topo.

**SSR:** Leaflet acessa `window` no import. O componente precisa ser carregado só no cliente — `const MapLesson = lazy(() => import('@/components/MapLesson'))` dentro do `LessonSheet`, com `<Suspense>` mostrando um spinner. Sem mudanças no servidor.

**Sem custos / sem chaves:** Esri World Imagery via `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (uso atribuído à Esri/Maxar — já incluímos o crédito no rodapé do mapa, como o termo pede). OSM via tile padrão. MapBiomas via WMS público (`https://plataforma.brasil.mapbiomas.org/wms`).

## Limites honestos

- Imagens de satélite gratuitas têm resolução boa em áreas urbanas e médias em zona rural — suficiente para reconhecer cercas/rios na maioria dos casos, mas pode faltar nitidez em propriedades muito pequenas.
- A "atualização" depende do provedor (Esri atualiza por região, alguns lugares têm imagens de 1–3 anos). Para o aprendizado isso não atrapalha.
- Para integração real com SICAR (gerar shapefile/GeoPackage para importar), dá para exportar GeoJSON do desenho e converter — fica como passo futuro fora deste protótipo.

## Pergunta antes de implementar

Posso seguir com **Leaflet + Esri Imagery + Geoman + turf**, usando um sítio-exemplo fixo (lat/lng que eu escolher) como propriedade de treino do "Seu João"? Ou você tem coordenadas de uma propriedade real que prefere usar de demonstração?
