import type { AppData, Exercise } from '../types'

/** GIFs via jsDelivr — ExerciseGymGifsDB */
const GIF = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0'
const CREDIT = 'Animação: ExerciseGymGifsDB · Gym Visual'

function id() {
  return crypto.randomUUID()
}

const EX_ABDUTORA = id()
const EX_EXTENSORA = id()
const EX_AGACHO = id()
const EX_STIFF = id()
const EX_PELVICA = id()
const EX_LEG45 = id()
const EX_FLEXORA = id()
const EX_PANTURRILHA = id()

const today = new Date().toISOString().slice(0, 10)

/**
 * Ordem da ficha (caderno):
 * 1 Abdutora · 2 Extensora · 3 Agacho · 4 Stiff
 * 5 Elevação pélvica · 6 Leg 45 · 7 Cadeira flexora · 8 Panturrilha
 */
export const FICHA_ORDER = [
  'Abdutora',
  'Extensora',
  'Agacho',
  'Stiff',
  'Elevação pélvica',
  'Leg 45°',
  'Cadeira flexora',
  'Panturrilha',
] as const

/** aliases para reordenar dados antigos (ex: Agachamento → pos. do Agacho) */
const ORDER_ALIASES: Record<string, string> = {
  agachamento: 'Agacho',
  'leg 45': 'Leg 45°',
  'leg 45°': 'Leg 45°',
  elevacao: 'Elevação pélvica',
  'elevação pélvica': 'Elevação pélvica',
}

export function sortByFichaOrder(exercises: Exercise[]): Exercise[] {
  const rank = (name: string) => {
    const key = name.trim().toLowerCase()
    const canonical = ORDER_ALIASES[key] ?? name
    const idx = FICHA_ORDER.findIndex(
      (n) => n.toLowerCase() === canonical.toLowerCase() || n.toLowerCase() === key
    )
    return idx === -1 ? 999 : idx
  }
  return [...exercises].sort((a, b) => rank(a.name) - rank(b.name))
}

export const INITIAL_DATA: AppData = {
  profileName: 'Atleta',
  workoutTitle: 'Treino de perna 2x semana',
  warmupNote: 'Mobilidade — tornozelo, joelho e quadril',
  coreNote: 'Abdominal → prancha e alongamentos do core',
  goals: ['↑ volume', '↑ amplitude'],
  exercises: [
    // 1
    {
      id: EX_ABDUTORA,
      name: 'Abdutora',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 15,
      motion: 'abduction',
      gifUrl: `${GIF}/abductors/lever-seated-hip-abduction.gif`,
      gifCredit: CREDIT,
      steps: [
        'Sente-se com a coluna e o quadril firmes no encosto.',
        'Posicione as pernas nos pads internos, pés firmes.',
        'Empurre as pernas para fora com controle (abdução).',
        'Volte lentamente sem deixar os pesos baterem.',
      ],
      tips: 'Não balance o tronco. Foque glúteo médio e controle a volta.',
    },
    // 2
    {
      id: EX_EXTENSORA,
      name: 'Extensora',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      motion: 'extension',
      gifUrl: `${GIF}/quads/lever-leg-extension.gif`,
      gifCredit: CREDIT,
      steps: [
        'Ajuste o pad logo acima do tornozelo.',
        'Prenda o quadril no assento e segure as alças.',
        'Estenda o joelho quase por completo, sem travar.',
        'Desça em 2–3 segundos sentindo o quadríceps.',
      ],
      tips: 'Evite chutar a carga. Movimento fluido e amplitude completa.',
    },
    // 3
    {
      id: EX_AGACHO,
      name: 'Agacho',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 10,
      warmup: '1×15 aquecimento',
      motion: 'squat',
      gifUrl: `${GIF}/glutes/barbell-full-squat.gif`,
      gifCredit: CREDIT,
      steps: [
        'Pés na largura dos ombros, pontas levemente para fora.',
        'Peito aberto, core e glúteo ativos.',
        'Desça o quadril para trás e baixo (joelhos no sentido dos pés).',
        'Empurre o chão com os calcanhares e estenda o quadril no topo.',
      ],
      tips: 'Não deixe o joelho colapsar para dentro. Desça o máximo sem perder a postura.',
    },
    // 4
    {
      id: EX_STIFF,
      name: 'Stiff',
      muscleGroup: 'Pernas',
      sets: 4,
      targetReps: 10,
      motion: 'hinge',
      gifUrl: `${GIF}/hamstrings/barbell-straight-leg-deadlift.gif`,
      gifCredit: CREDIT,
      steps: [
        'Pés na largura dos quadris, joelhos levemente flexionados.',
        'Empurre o glúteo para trás, barra/halteres próximo às coxas.',
        'Desça até sentir o alongamento do posterior (costas retas).',
        'Suba contraindo glúteos e posteriores de coxa.',
      ],
      tips: 'É dobradiça de quadril, não agachamento. Não arredonde a lombar.',
    },
    // 5
    {
      id: EX_PELVICA,
      name: 'Elevação pélvica',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 10,
      warmup: '1×12 aquecimento',
      motion: 'hipthrust',
      gifUrl: `${GIF}/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif`,
      gifCredit: CREDIT,
      steps: [
        'Costas superiores no banco, barra no creche do quadril.',
        'Pés no chão, canelas ~verticais no topo.',
        'Empurre o chão e eleve o quadril até alinhar com ombros e joelhos.',
        'Pause 1s no topo, desça controlado sem perder o contato com o banco.',
      ],
      tips: 'Queixo levemente no peito. Contraia o glúteo no topo — não hiperextenda a lombar.',
    },
    // 6
    {
      id: EX_LEG45,
      name: 'Leg 45°',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 12,
      motion: 'legpress',
      gifUrl: `${GIF}/glutes/sled-45-leg-press.gif`,
      gifCredit: CREDIT,
      steps: [
        'Pés no meio da plataforma, na largura dos ombros.',
        'Destrave com segurança e segure as alças.',
        'Desça até ~90° no joelho sem levantar o quadril do encosto.',
        'Empurre a plataforma sem travar o joelho no final.',
      ],
      tips: 'Amplitude com controle. Joelhos alinhados com os pés.',
    },
    // 7
    {
      id: EX_FLEXORA,
      name: 'Cadeira flexora',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 12,
      motion: 'curl',
      gifUrl: `${GIF}/hamstrings/lever-seated-leg-curl.gif`,
      gifCredit: CREDIT,
      steps: [
        'Pad justo acima do calcanhar; quadril fixo no assento.',
        'Flexione a perna puxando o calcanhar em direção ao glúteo.',
        'Aperte o posterior no fim da flexão.',
        'Volte controlado sem arquear a lombar.',
      ],
      tips: 'Movimento isolado do posterior. Nada de impulso com o tronco.',
    },
    // 8
    {
      id: EX_PANTURRILHA,
      name: 'Panturrilha',
      muscleGroup: 'Pernas',
      sets: 3,
      targetReps: 15,
      notes: 'Fazer 3× na semana',
      motion: 'calf',
      gifUrl: `${GIF}/calves/barbell-standing-calf-raise.gif`,
      gifCredit: CREDIT,
      steps: [
        'Ponta do pé no degrau/plataforma, calcanhar livre.',
        'Desça o calcanhar com amplitude máxima (alongamento).',
        'Suba sobre a ponta dos pés o mais alto possível.',
        'Pause 1 segundo no topo e repita.',
      ],
      tips: 'Amplitude total. Controle a descida — é onde a panturrilha cresce.',
    },
  ],
  sessions: [
    {
      id: id(),
      date: today,
      label: 'Sessão de hoje',
      entries: [
        { exerciseId: EX_ABDUTORA, performedReps: null, currentWeight: null },
        { exerciseId: EX_EXTENSORA, performedReps: null, currentWeight: null },
        { exerciseId: EX_AGACHO, performedReps: null, currentWeight: null },
        { exerciseId: EX_STIFF, performedReps: null, currentWeight: null },
        { exerciseId: EX_PELVICA, performedReps: null, currentWeight: null },
        { exerciseId: EX_LEG45, performedReps: null, currentWeight: null },
        { exerciseId: EX_FLEXORA, performedReps: null, currentWeight: null },
        { exerciseId: EX_PANTURRILHA, performedReps: null, currentWeight: null },
      ],
    },
  ],
  activeSessionId: null,
}

INITIAL_DATA.activeSessionId = INITIAL_DATA.sessions[0].id
