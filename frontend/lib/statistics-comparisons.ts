import { type StatisticsResolvedFilters } from "@/lib/statistics-filters"
import { type SalesByCityPoint, type SalesByStatePoint } from "@/lib/types"

const STATE_NAMES_BY_UF: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapa",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceara",
  DF: "Distrito Federal",
  ES: "Espirito Santo",
  GO: "Goias",
  MA: "Maranhao",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Para",
  PB: "Paraiba",
  PR: "Parana",
  PE: "Pernambuco",
  PI: "Piaui",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondonia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "Sao Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
}

const MONTH_LABELS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

type ExecutiveContext = {
  analysisLabel: string
  periodLabel: string
  participationPercentage: number | null
  rankingPosition: number | null
  rankingTotal: number
  selectedStateData?: SalesByStatePoint
}

function parseDateValue(dateValue: string): Date | null {
  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function formatMonthYearLabel(dateValue: string): string {
  const parsed = parseDateValue(dateValue)
  if (!parsed) return dateValue

  const month = MONTH_LABELS_SHORT[parsed.getMonth()] ?? ""
  return `${month} ${parsed.getFullYear()}`.trim()
}

export function formatExecutivePeriod(filters: StatisticsResolvedFilters): string {
  if (filters.startDate && filters.endDate) {
    return `${formatMonthYearLabel(filters.startDate)} -> ${formatMonthYearLabel(filters.endDate)}`
  }

  if (filters.startDate) {
    return `A partir de ${formatMonthYearLabel(filters.startDate)}`
  }

  if (filters.endDate) {
    return `Ate ${formatMonthYearLabel(filters.endDate)}`
  }

  return "Todo o periodo disponivel"
}

export function getStateNameByUf(uf: string): string {
  return STATE_NAMES_BY_UF[uf.toUpperCase()] ?? uf.toUpperCase()
}

export function normalizeGeoKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^0-9A-Za-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function calculateSharePercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0
  }

  return (value / total) * 100
}

export function calculateRankingPosition<T>(
  items: T[],
  predicate: (item: T) => boolean,
): number {
  const index = items.findIndex(predicate)
  return index >= 0 ? index + 1 : 0
}

export function calculateDeltaPercentage(currentValue: number, baselineValue: number): number {
  if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue) || baselineValue <= 0) {
    return 0
  }

  return ((currentValue - baselineValue) / baselineValue) * 100
}

export function findCityByName(
  cityPoints: SalesByCityPoint[],
  cityName: string,
): SalesByCityPoint | undefined {
  const normalized = normalizeGeoKey(cityName)
  return cityPoints.find((item) => normalizeGeoKey(item.customer_city) === normalized)
}

export function buildExecutiveContext(
  filters: StatisticsResolvedFilters,
  salesByStateComparison: SalesByStatePoint[],
): ExecutiveContext {
  const periodLabel = formatExecutivePeriod(filters)
  const rankingTotal = salesByStateComparison.length

  if (!filters.state) {
    return {
      analysisLabel: "Brasil (visao nacional)",
      periodLabel,
      participationPercentage: null,
      rankingPosition: null,
      rankingTotal,
    }
  }

  const stateCode = filters.state.toUpperCase()
  const stateName = getStateNameByUf(stateCode)
  const selectedStateData = salesByStateComparison.find(
    (item) => item.customer_state.toUpperCase() === stateCode,
  )

  const totalBrazilRevenue = salesByStateComparison.reduce((sum, item) => sum + item.revenue, 0)
  const participationPercentage = selectedStateData
    ? calculateSharePercentage(selectedStateData.revenue, totalBrazilRevenue)
    : 0
  const rankingPosition = selectedStateData
    ? calculateRankingPosition(
        salesByStateComparison,
        (item) => item.customer_state.toUpperCase() === stateCode,
      )
    : 0

  const analysisLabel = filters.city
    ? `${stateName} (${stateCode}) · ${filters.city}`
    : `${stateName} (${stateCode})`

  return {
    analysisLabel,
    periodLabel,
    participationPercentage,
    rankingPosition,
    rankingTotal,
    selectedStateData,
  }
}
