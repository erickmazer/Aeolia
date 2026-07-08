// Catálogo de exercícios técnicos — atrelados a uma SKILL (alvo) e, quando faz
// sentido, a uma MÚSICA (prep). Respeita a filosofia "aprender através da música":
// o exercício prepara pra tocar algo, não é drill solto de primeira classe.
// Conhecimento/ideias de treino — mora em código.

import type { SkillId } from './data'

export interface Exercise {
  id: string
  nome: string
  alvo: SkillId
  /** dificuldade sugerida 1–5 (hint, não é o nível de treino do usuário). */
  dif: number
  desc: string
  /** música que este exercício ajuda a destravar (ou null). */
  prep: string | null
}

// Níveis de treino do usuário (0 = não treina; 1–3 = em treino).
export const EX_LEVELS = [
  { nome: 'Quero treinar', dica: 'Comece bem devagar no metrônomo.' },
  { nome: 'Treinando', dica: 'Solte a mão e suba o tempo aos poucos.' },
  { nome: 'Fluindo', dica: 'Toque sem pensar em cada dedo.' },
  { nome: 'Automático', dica: 'No automático — pronto pra aplicar nas músicas.' },
]
export const EX_MAX = EX_LEVELS.length - 1 // 3

export const EXERCISES: Exercise[] = [
  { id: 'ex_pima', nome: 'Dedilhado p-i-m-a contínuo', alvo: 'fingerstyle', dif: 2, prep: 'Hallelujah', desc: 'Num acorde fixo, repita polegar-indicador-médio-anelar até virar automático. Comece devagar no metrônomo.' },
  { id: 'ex_troca_cgamf', nome: 'Troca C–G–Am–F no metrônomo', alvo: 'troca-acordes', dif: 1, prep: 'Hallelujah', desc: '4 tempos por acorde, som limpo antes de acelerar. Suba 5 BPM quando não errar.' },
  { id: 'ex_pivo', nome: 'Troca com dedo-âncora (pivô)', alvo: 'troca-acordes', dif: 2, prep: null, desc: 'Mantenha um dedo fixo entre dois acordes que o compartilham. Reduz o salto da mão.' },
  { id: 'ex_arpejo_solto', nome: 'Arpejo em cordas soltas', alvo: 'fingerstyle', dif: 1, prep: null, desc: 'Sem trastear: polegar nos bordões, i-m-a nas primas. Foco em som limpo e parelho.' },
  { id: 'ex_travis', nome: 'Travis básico: baixo alternado + melodia', alvo: 'travis-picking', dif: 4, prep: 'Blackbird', desc: 'Polegar alterna bordões no tempo enquanto os dedos pontuam a melodia. Mãos como dois sistemas.' },
  { id: 'ex_baixo_cg', nome: 'Baixo alternado em C e G', alvo: 'baixos-alternados', dif: 2, prep: null, desc: 'Só o polegar, metrônomo lento, alternando tônica e quinta. Base do country/folk.' },
  { id: 'ex_indep', nome: 'Polegar constante, dedos sincopados', alvo: 'independencia', dif: 5, prep: null, desc: 'Polegar mantém pulso fixo; dedos entram fora do tempo. Treina as duas mãos separadas.' },
  { id: 'ex_bossa', nome: 'Levada de bossa: baixo + contratempo', alvo: 'bossa-nova', dif: 5, prep: 'Wave', desc: 'Polegar no 1 e no 3; acordes nos contratempos. Comece com um acorde só.' },
  { id: 'ex_campo', nome: 'Campo harmônico maior (I–ii–iii–IV–V–vi)', alvo: 'harmonia', dif: 3, prep: null, desc: 'Toque e nomeie cada acorde do campo. Entender por que as músicas "funcionam".' },
  { id: 'ex_dinamica', nome: 'Crescendo/decrescendo no arpejo', alvo: 'dinamica', dif: 2, prep: null, desc: 'Mesma sequência do pianíssimo ao fortíssimo e de volta. Controle de volume com os dedos.' },
  { id: 'ex_ritmo_mute', nome: 'Batida com cordas abafadas', alvo: 'ritmo', dif: 1, prep: null, desc: 'Mão esquerda abafa; direita só marca o ritmo. Isola a levada sem se preocupar com acorde.' },
]
