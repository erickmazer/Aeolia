// Trilha curada (ROADMAP_PHASE do modelo): fases contendo músicas por nome.
// Curado em código por ora; no futuro pode virar dado canônico.

export interface RoadmapPhase {
  fase: string
  tema: string
  songs: string[]
}

export const ROADMAP: RoadmapPhase[] = [
  { fase: 'Fase 1', tema: 'Fundamentos', songs: ['Hallelujah', 'Fast Car', 'Aquarela', 'Trem-Bala', 'Asa Branca'] },
  { fase: 'Fase 2', tema: 'Dedilhado e canção', songs: ['Here Comes the Sun', 'Dust in the Wind', 'Você é Linda'] },
  { fase: 'Fase 3', tema: 'Independência e bossa', songs: ['Blackbird', 'Garota de Ipanema', 'Wave'] },
  { fase: 'Fase 4', tema: 'Grandes desafios', songs: ['Classical Gas', 'Cavatina', 'Drifting'] },
]
