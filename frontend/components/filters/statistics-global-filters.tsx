"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useEffect, useState, useTransition } from "react"

type StatisticsGlobalFiltersProps = {
  currentFilters: {
    state: string
    city: string
    startDate: string
    endDate: string
  }
  stateOptions: string[]
  cityOptions: string[]
}

type FilterDraft = {
  state: string
  city: string
  startDate: string
  endDate: string
}

export function StatisticsGlobalFilters({
  currentFilters,
  stateOptions,
  cityOptions,
}: StatisticsGlobalFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [draft, setDraft] = useState<FilterDraft>(currentFilters)

  useEffect(() => {
    setDraft(currentFilters)
  }, [currentFilters])

  const applyFilters = (nextFilters: FilterDraft) => {
    const params = new URLSearchParams(searchParams.toString())

    if (nextFilters.state) params.set("state", nextFilters.state)
    else params.delete("state")

    if (nextFilters.city && nextFilters.state) params.set("city", nextFilters.city)
    else params.delete("city")

    if (nextFilters.startDate) params.set("start_date", nextFilters.startDate)
    else params.delete("start_date")

    if (nextFilters.endDate) params.set("end_date", nextFilters.endDate)
    else params.delete("end_date")

    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname

    startTransition(() => {
      router.push(nextUrl)
    })
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applyFilters(draft)
  }

  const onClear = () => {
    const cleared: FilterDraft = {
      state: "",
      city: "",
      startDate: "",
      endDate: "",
    }
    setDraft(cleared)
    applyFilters(cleared)
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-12">
      <div className="grid gap-1 lg:col-span-3">
        <label htmlFor="filter-start-date" className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Periodo inicial
        </label>
        <input
          id="filter-start-date"
          type="date"
          value={draft.startDate}
          max={draft.endDate || undefined}
          onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
        />
      </div>

      <div className="grid gap-1 lg:col-span-3">
        <label htmlFor="filter-end-date" className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Periodo final
        </label>
        <input
          id="filter-end-date"
          type="date"
          value={draft.endDate}
          min={draft.startDate || undefined}
          onChange={(event) => setDraft((prev) => ({ ...prev, endDate: event.target.value }))}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
        />
      </div>

      <div className="grid gap-1 lg:col-span-2">
        <label htmlFor="filter-state" className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Estado
        </label>
        <select
          id="filter-state"
          value={draft.state}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              state: event.target.value,
              city: event.target.value === prev.state ? prev.city : "",
            }))
          }
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2"
        >
          <option value="">Todos</option>
          {stateOptions.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1 lg:col-span-2">
        <label htmlFor="filter-city" className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Cidade
        </label>
        <select
          id="filter-city"
          value={draft.city}
          disabled={!draft.state}
          onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        >
          <option value="">{draft.state ? "Todas" : "Selecione um estado"}</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2 lg:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
        >
          {isPending ? "Aplicando..." : "Aplicar"}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={isPending}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        >
          Limpar
        </button>
      </div>
    </form>
  )
}
