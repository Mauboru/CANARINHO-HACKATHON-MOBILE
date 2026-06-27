// Sítio-exemplo do "Seu João" — Sítio Boa Vista (área rural fictícia em MG)
// Coordenadas escolhidas em zona rural com imagem de satélite legível.
export const SAMPLE_PROPERTY = {
  center: [-19.9245, -43.9352] as [number, number],
  zoom: 16,
  // Gabarito do perímetro (polígono fechado, lng/lat no padrão GeoJSON)
  perimeter: [
    [-43.9368, -19.9235],
    [-43.9338, -19.9235],
    [-43.9336, -19.9258],
    [-43.9370, -19.9258],
    [-43.9368, -19.9235],
  ] as [number, number][],
  // Sede da fazenda
  sede: [-43.9352, -19.9246] as [number, number],
  // Linha de rio (para mata ciliar)
  rio: [
    [-43.9370, -19.9242],
    [-43.9358, -19.9248],
    [-43.9344, -19.9252],
    [-43.9336, -19.9255],
  ] as [number, number][],
  // Estrada/servidão
  estrada: [
    [-43.9368, -19.9236],
    [-43.9352, -19.9246],
    [-43.9338, -19.9257],
  ] as [number, number][],
  // Área de uso consolidado (pasto)
  consolidada: [
    [-43.9360, -19.9240],
    [-43.9345, -19.9240],
    [-43.9345, -19.9252],
    [-43.9360, -19.9252],
    [-43.9360, -19.9240],
  ] as [number, number][],
};
