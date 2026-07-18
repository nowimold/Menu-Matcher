export type MenuInputs = {
  preferred: string[]
  disliked: string[]
}

export type RecommendationItem = {
  name: string
  reason: string
}

type RankedCandidate = {
  name: string
  normalized: string
  score: number
  hostRank: number | null
  participantRank: number | null
}

type CategoryDefinition = {
  aliases: string[]
  menus: string[]
}

const FALLBACK_MENUS = [
  '파스타',
  '샤브샤브',
  '규동',
  '쌀국수',
  '덮밥',
  '돈까스',
  '카레',
  '샌드위치',
  '떡볶이',
  '비빔밥',
]

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    aliases: ['밥 종류', '밥종류', '밥', '덮밥류', '볶음밥'],
    menus: ['김치볶음밥', '제육덮밥', '비빔밥', '오므라이스', '규동', '카레라이스'],
  },
  {
    aliases: ['매운 음식', '매운음식', '매운 메뉴', '매운메뉴'],
    menus: ['닭갈비', '떡볶이', '제육볶음', '마라탕', '불닭', '짬뽕'],
  },
  {
    aliases: ['한식', '한국 음식', '한국음식'],
    menus: ['비빔밥', '김치찌개', '불고기', '된장찌개', '삼계탕', '갈비탕'],
  },
  {
    aliases: ['중식', '중국 음식', '중국음식'],
    menus: ['짜장면', '짬뽕', '마라탕', '탕수육', '유산슬', '마파두부'],
  },
  {
    aliases: ['면', '면 요리', '면요리', '누들', '국수'],
    menus: ['라면', '파스타', '칼국수', '우동', '쌀국수', '냉면'],
  },
  {
    aliases: ['고기', '육류', '고기 요리', '고기요리'],
    menus: ['삼겹살', '갈비', '스테이크', '제육볶음', '수육', '불고기'],
  },
  {
    aliases: ['국물 있는 음식', '국물있는음식', '국물 음식', '국물음식'],
    menus: ['김치찌개', '된장찌개', '해장국', '곰탕', '우동', '짬뽕'],
  },
  {
    aliases: ['야식', '밤참'],
    menus: ['치킨', '족발', '떡볶이', '라면', '닭발', '곱창'],
  },
  {
    aliases: ['디저트', '후식', '달달한 음식', '달달한음식'],
    menus: ['티라미수', '치즈케이크', '마카롱', '빙수', '아이스크림', '와플'],
  },
]

const normalizeMenuName = (menu: string) => menu.trim().toLocaleLowerCase()
const normalizeCategoryKey = (menu: string) =>
  normalizeMenuName(menu).replace(/\s+/g, '')
const looksAbstractExpression = (input: string) =>
  /(종류|음식|요리|메뉴|카테고리|류)$/.test(normalizeCategoryKey(input))

const categoryMenuLookup = new Map<string, string[]>(
  CATEGORY_DEFINITIONS.flatMap((definition) =>
    definition.aliases.map((alias) => [normalizeCategoryKey(alias), definition.menus] as const),
  ),
)

const resolveCategoryMenus = (input: string): string[] | null => {
  const normalized = normalizeCategoryKey(input)
  const direct = categoryMenuLookup.get(normalized)
  if (direct) {
    return direct
  }

  for (const [alias, menus] of categoryMenuLookup.entries()) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return menus
    }
  }

  return null
}

const resolveConcreteMenus = (input: string): { menus: string[]; abstract: boolean } => {
  const categoryMenus = resolveCategoryMenus(input)
  if (categoryMenus) {
    return { menus: categoryMenus, abstract: true }
  }

  if (looksAbstractExpression(input)) {
    return { menus: FALLBACK_MENUS, abstract: true }
  }

  return { menus: [input.trim()], abstract: false }
}

const pickRepresentativeMenu = (input: string, menus: string[]) => {
  const hash = Array.from(normalizeCategoryKey(input)).reduce(
    (accumulator, char) => accumulator + char.charCodeAt(0),
    0,
  )
  return menus[hash % menus.length]
}

const buildPreferredRankMap = (menus: string[]) => {
  const rankMap = new Map<string, { rank: number; original: string }>()
  menus.forEach((rawMenu, index) => {
    const trimmed = rawMenu.trim()
    if (!trimmed) {
      return
    }

    const resolved = resolveConcreteMenus(trimmed)
    const resolvedMenu = resolved.abstract
      ? pickRepresentativeMenu(trimmed, resolved.menus)
      : trimmed
    const normalized = normalizeMenuName(resolvedMenu)
    if (!rankMap.has(normalized)) {
      rankMap.set(normalized, { rank: index + 1, original: resolvedMenu })
    }
  })
  return rankMap
}

const buildDislikedSet = (menus: string[]) => {
  const dislikedSet = new Set<string>()
  menus.forEach((rawMenu) => {
    const trimmed = rawMenu.trim()
    if (!trimmed) {
      return
    }

    const resolved = resolveConcreteMenus(trimmed)
    if (resolved.abstract) {
      resolved.menus.forEach((menu) => dislikedSet.add(normalizeMenuName(menu)))
      return
    }

    dislikedSet.add(normalizeMenuName(trimmed))
  })

  return dislikedSet
}

const createReason = (candidate: RankedCandidate) => {
  if (candidate.hostRank && candidate.participantRank) {
    return `호스트(${candidate.hostRank}순위)와 참여자(${candidate.participantRank}순위) 모두 선호한 메뉴예요.`
  }

  if (candidate.hostRank) {
    return `호스트가 ${candidate.hostRank}순위로 선호했고, 참여자가 싫어하지 않는 메뉴예요.`
  }

  return `참여자가 ${candidate.participantRank}순위로 선호했고, 호스트가 싫어하지 않는 메뉴예요.`
}

const createNeutralReason = (isOppositeCase: boolean) =>
  isOppositeCase
    ? '선호/비선호가 크게 엇갈려 공통 선호를 찾기 어려워, 두 분 모두 싫어하지 않는 제3의 메뉴를 제안했어요.'
    : '공통 추천 후보가 3개보다 적어, 두 분 모두 싫어하지 않는 제3의 메뉴를 함께 제안했어요.'

export const buildMenuRecommendations = (
  hostInputs: MenuInputs,
  participantInputs: MenuInputs,
): RecommendationItem[] => {
  const hostRankMap = buildPreferredRankMap(hostInputs.preferred)
  const participantRankMap = buildPreferredRankMap(participantInputs.preferred)
  const dislikedSet = buildDislikedSet([
    ...hostInputs.disliked,
    ...participantInputs.disliked,
  ])

  const normalizedPreferredMenus = new Set([
    ...hostRankMap.keys(),
    ...participantRankMap.keys(),
  ])

  const rankedCandidates: RankedCandidate[] = []
  normalizedPreferredMenus.forEach((normalizedMenu) => {
    if (dislikedSet.has(normalizedMenu)) {
      return
    }

    const hostRank = hostRankMap.get(normalizedMenu)?.rank ?? null
    const participantRank = participantRankMap.get(normalizedMenu)?.rank ?? null
    const sourceName =
      hostRankMap.get(normalizedMenu)?.original ??
      participantRankMap.get(normalizedMenu)?.original ??
      normalizedMenu

    const hostScore = hostRank ? Math.max(1, 4 - hostRank) : 0
    const participantScore = participantRank ? Math.max(1, 4 - participantRank) : 0
    rankedCandidates.push({
      name: sourceName,
      normalized: normalizedMenu,
      score: hostScore + participantScore,
      hostRank,
      participantRank,
    })
  })

  rankedCandidates.sort(
    (left, right) =>
      right.score - left.score ||
      Number(Boolean(right.hostRank && right.participantRank)) -
        Number(Boolean(left.hostRank && left.participantRank)) ||
      (left.hostRank ?? 99) + (left.participantRank ?? 99) -
        ((right.hostRank ?? 99) + (right.participantRank ?? 99)) ||
      left.name.localeCompare(right.name, 'ko'),
  )

  const recommendations: RecommendationItem[] = rankedCandidates
    .slice(0, 3)
    .map((candidate) => ({
      name: resolveConcreteMenus(candidate.name).abstract
        ? pickRepresentativeMenu(candidate.name, resolveConcreteMenus(candidate.name).menus)
        : candidate.name,
      reason: createReason(candidate),
    }))

  const usedMenus = new Set(
    recommendations.map((recommendation) => normalizeMenuName(recommendation.name)),
  )
  const isOppositeCase = recommendations.length === 0

  for (const neutralMenu of FALLBACK_MENUS) {
    if (recommendations.length >= 3) {
      break
    }

    const normalized = normalizeMenuName(neutralMenu)
    if (dislikedSet.has(normalized) || usedMenus.has(normalized)) {
      continue
    }

    recommendations.push({
      name: neutralMenu,
      reason: createNeutralReason(isOppositeCase),
    })
    usedMenus.add(normalized)
  }

  return recommendations.slice(0, 3)
}
