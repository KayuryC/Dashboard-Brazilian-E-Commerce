import { type DashboardFiltersParams } from "@/services/api"

export type StatisticsSearchParams = Record<string, string | string[] | undefined>

export type StatisticsResolvedFilters = {
  state: string
  city: string
  startDate: string
  endDate: string
}

function getSearchParam(params: StatisticsSearchParams, key: string): string {
  const value = params[key]
  if (Array.isArray(value)) return (value[0] ?? "").trim()
  return (value ?? "").trim()
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function formatDateLabel(dateValue: string): string {
  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(parsed)
}

export function parseStatisticsFilters(
  searchParams: StatisticsSearchParams,
): StatisticsResolvedFilters {
  const rawState = getSearchParam(searchParams, "state").toUpperCase()
  const state = /^[A-Z]{2}$/.test(rawState) ? rawState : ""
  const city = state ? collapseSpaces(getSearchParam(searchParams, "city")) : ""

  return {
    state,
    city,
    startDate: getSearchParam(searchParams, "start_date"),
    endDate: getSearchParam(searchParams, "end_date"),
  }
}

export function buildDateScopeFilters(
  filters: StatisticsResolvedFilters,
): DashboardFiltersParams {
  return {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  }
}

export function buildActiveDashboardFilters(
  filters: StatisticsResolvedFilters,
): DashboardFiltersParams {
  return {
    ...buildDateScopeFilters(filters),
    state: filters.state || undefined,
    city: filters.city || undefined,
  }
}

export function buildStatisticsContextLabel(
  filters: StatisticsResolvedFilters,
): string {
  const period =
    filters.startDate && filters.endDate
      ? `${formatDateLabel(filters.startDate)} a ${formatDateLabel(filters.endDate)}`
      : filters.startDate
        ? `a partir de ${formatDateLabel(filters.startDate)}`
        : filters.endDate
          ? `ate ${formatDateLabel(filters.endDate)}`
          : "todo o periodo"

  const stateLabel = filters.state || "Todos os estados"
  const cityLabel = filters.state ? (filters.city || "Todas as cidades") : "Todas as cidades"

  return `Periodo: ${period} · Estado: ${stateLabel} · Cidade: ${cityLabel}`
}
