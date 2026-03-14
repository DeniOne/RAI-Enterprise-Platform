'use client';

import React, { useEffect, useState } from 'react';
import {
  api,
  type SeasonListItem,
  type StrategyForecastRunHistoryItem,
  type StrategyForecastRunResponse,
  type StrategyForecastScenarioRecord,
} from '@/lib/api';
import { webFeatureFlags } from '@/lib/feature-flags';
import { AlertCircle, BarChart3, BookmarkPlus, Sigma, Trash2, TrendingUp } from 'lucide-react';

type ScopeLevel = 'company' | 'farm' | 'field';
type ForecastDomain = 'agro' | 'economics' | 'finance' | 'risk';
type ScenarioLever =
  | 'yield_pct'
  | 'sales_price_pct'
  | 'input_cost_pct'
  | 'opex_pct'
  | 'working_capital_days'
  | 'disease_risk_pct';

const DOMAIN_OPTIONS: Array<{ value: ForecastDomain; label: string }> = [
  { value: 'agro', label: 'Агро' },
  { value: 'economics', label: 'Экономика' },
  { value: 'finance', label: 'Финансы' },
  { value: 'risk', label: 'Риски' },
];

const LEVER_OPTIONS: Array<{ value: ScenarioLever; label: string; placeholder: string }> = [
  { value: 'yield_pct', label: 'Урожайность, %', placeholder: '0' },
  { value: 'sales_price_pct', label: 'Цена реализации, %', placeholder: '0' },
  { value: 'input_cost_pct', label: 'Себестоимость ресурсов, %', placeholder: '0' },
  { value: 'opex_pct', label: 'Операционные расходы, %', placeholder: '0' },
  { value: 'working_capital_days', label: 'Оборотный капитал, дни', placeholder: '0' },
  { value: 'disease_risk_pct', label: 'Риск болезней, %', placeholder: '0' },
];

const TABS = ['Прогноз', 'Факторы', 'Сценарии', 'Оптимизация', 'Риски'] as const;
const SAVED_SCENARIOS_STORAGE_KEY = 'rai.strategy.forecasts.saved-scenarios.v1';
const HISTORY_PAGE_SIZE = 6;
const EMPTY_LEVER_VALUES: Record<ScenarioLever, string> = {
  yield_pct: '',
  sales_price_pct: '',
  input_cost_pct: '',
  opex_pct: '',
  working_capital_days: '',
  disease_risk_pct: '',
};

export default function StrategyForecastsPage() {
  const enabled = webFeatureFlags.strategyForecasts;
  const [seasons, setSeasons] = useState<SeasonListItem[]>([]);
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>('company');
  const [seasonId, setSeasonId] = useState('');
  const [horizonDays, setHorizonDays] = useState<30 | 90 | 180 | 365>(90);
  const [farmId, setFarmId] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [crop, setCrop] = useState('');
  const [domains, setDomains] = useState<ForecastDomain[]>(['agro', 'economics', 'finance', 'risk']);
  const [scenarioName, setScenarioName] = useState('Рабочий сценарий');
  const [leverValues, setLeverValues] = useState<Record<ScenarioLever, string>>(EMPTY_LEVER_VALUES);
  const [result, setResult] = useState<StrategyForecastRunResponse | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Прогноз');
  const [savedScenarios, setSavedScenarios] = useState<StrategyForecastScenarioRecord[]>([]);
  const [recentRuns, setRecentRuns] = useState<StrategyForecastRunHistoryItem[]>([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [recentRunsHasMore, setRecentRunsHasMore] = useState(false);
  const [historyRiskTierFilter, setHistoryRiskTierFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [historyOnlyDegraded, setHistoryOnlyDegraded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [feedbackSubmittingRunId, setFeedbackSubmittingRunId] = useState<string | null>(null);
  const [feedbackDialogRun, setFeedbackDialogRun] = useState<StrategyForecastRunHistoryItem | null>(null);
  const [feedbackRevenueInput, setFeedbackRevenueInput] = useState('');
  const [feedbackMarginInput, setFeedbackMarginInput] = useState('');
  const [feedbackCashFlowInput, setFeedbackCashFlowInput] = useState('');
  const [feedbackYieldInput, setFeedbackYieldInput] = useState('');
  const [feedbackNoteInput, setFeedbackNoteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.seasons
      .list()
      .then((response) => {
        if (cancelled) return;
        setSeasons(response.data);
        if (!seasonId && response.data.length > 0) {
          setSeasonId(response.data[0].id);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message ?? 'Не удалось загрузить сезоны');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSeasons(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    const localShadow = loadScenarioShadowCache();

    api.ofs.strategyForecasts
      .listScenarios()
      .then((response) => {
        if (cancelled) return;
        const nextScenarios = response.data.slice(0, 20);
        persistSavedScenarios(nextScenarios, setSavedScenarios);
      })
      .catch(() => {
        if (cancelled) return;
        setSavedScenarios(localShadow);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null;

  async function loadRecentRuns(options?: { append?: boolean }) {
    const append = options?.append === true;
    const offset = append ? recentRuns.length : 0;

    try {
      setHistoryLoading(true);
      const response = await api.ofs.strategyForecasts.history({
        limit: HISTORY_PAGE_SIZE,
        offset,
        ...(seasonId ? { seasonId } : {}),
        ...(historyRiskTierFilter !== 'all'
          ? { riskTier: historyRiskTierFilter }
          : {}),
        ...(historyOnlyDegraded ? { degraded: true } : {}),
      });

      setRecentRuns((current) =>
        append ? [...current, ...response.data.items] : response.data.items,
      );
      setRecentRunsTotal(response.data.total);
      setRecentRunsHasMore(response.data.hasMore);
    } catch {
      if (!append) {
        setRecentRuns([]);
        setRecentRunsTotal(0);
      }
      setRecentRunsHasMore(false);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const offset = 0;
      try {
        setHistoryLoading(true);
        const response = await api.ofs.strategyForecasts.history({
          limit: HISTORY_PAGE_SIZE,
          offset,
          ...(seasonId ? { seasonId } : {}),
          ...(historyRiskTierFilter !== 'all'
            ? { riskTier: historyRiskTierFilter }
            : {}),
          ...(historyOnlyDegraded ? { degraded: true } : {}),
        });
        if (cancelled) return;
        setRecentRuns(response.data.items);
        setRecentRunsTotal(response.data.total);
        setRecentRunsHasMore(response.data.hasMore);
      } catch {
        if (cancelled) return;
        setRecentRuns([]);
        setRecentRunsTotal(0);
        setRecentRunsHasMore(false);
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seasonId, historyRiskTierFilter, historyOnlyDegraded]);

  async function runForecast() {
    if (!seasonId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const adjustments = LEVER_OPTIONS
        .map((option) => ({
          lever: option.value,
          operator: 'delta' as const,
          value: Number(leverValues[option.value]),
        }))
        .filter((item) => Number.isFinite(item.value) && item.value !== 0);

      const response = await api.ofs.strategyForecasts.run({
        scopeLevel,
        seasonId,
        horizonDays,
        ...(farmId.trim() ? { farmId: farmId.trim() } : {}),
        ...(fieldId.trim() ? { fieldId: fieldId.trim() } : {}),
        ...(crop.trim() ? { crop: crop.trim() } : {}),
        domains,
        ...(adjustments.length > 0
          ? {
              scenario: {
                name: scenarioName.trim() || 'Рабочий сценарий',
                adjustments,
              },
            }
          : {}),
      });
      setResult(response.data);
      try {
        await loadRecentRuns({ append: false });
      } catch {
        // History is secondary and should not break the forecast flow.
      }
    } catch (e) {
      setError((e as Error).message ?? 'Не удалось построить прогноз');
    } finally {
      setLoading(false);
    }
  }

  function toggleDomain(domain: ForecastDomain) {
    setDomains((current) =>
      current.includes(domain)
        ? current.filter((item) => item !== domain)
        : [...current, domain],
    );
  }

  async function saveCurrentScenario() {
    if (!seasonId) {
      setError('Нельзя сохранить сценарий без выбранного сезона.');
      return;
    }

    const hasAnyAdjustment = LEVER_OPTIONS.some(
      (option) => Number(leverValues[option.value] || 0) !== 0,
    );

    if (!hasAnyAdjustment) {
      setError('Сначала задайте хотя бы один сценарный рычаг.');
      return;
    }

    try {
      setError(null);
      const response = await api.ofs.strategyForecasts.saveScenario({
        name: scenarioName.trim() || 'Рабочий сценарий',
        scopeLevel,
        seasonId,
        horizonDays,
        farmId,
        fieldId,
        crop,
        domains,
        leverValues,
      });
      const deduplicated = savedScenarios.filter((item) => item.id !== response.data.id);
      persistSavedScenarios([response.data, ...deduplicated].slice(0, 20), setSavedScenarios);
    } catch (e) {
      setError((e as Error).message ?? 'Не удалось сохранить сценарий');
    }
  }

  function loadSavedScenario(record: StrategyForecastScenarioRecord) {
    setScopeLevel(record.scopeLevel);
    setSeasonId(record.seasonId);
    setHorizonDays(record.horizonDays);
    setFarmId(record.farmId);
    setFieldId(record.fieldId);
    setCrop(record.crop);
    setDomains(record.domains);
    setScenarioName(record.name);
    setLeverValues(normalizeLeverValues(record.leverValues));
    setActiveTab('Сценарии');
    setError(null);
  }

  async function deleteSavedScenario(recordId: string) {
    try {
      setError(null);
      await api.ofs.strategyForecasts.deleteScenario(recordId);
      persistSavedScenarios(
        savedScenarios.filter((item) => item.id !== recordId),
        setSavedScenarios,
      );
    } catch (e) {
      setError((e as Error).message ?? 'Не удалось удалить сценарий');
    }
  }

  async function submitRunFeedback(run: StrategyForecastRunHistoryItem) {
    const payload = {
      actualRevenue: parseOptionalNumber(feedbackRevenueInput),
      actualMargin: parseOptionalNumber(feedbackMarginInput),
      actualCashFlow: parseOptionalNumber(feedbackCashFlowInput),
      actualYield: parseOptionalNumber(feedbackYieldInput),
      note: feedbackNoteInput.trim() || undefined,
    };

    if (
      payload.actualRevenue === undefined &&
      payload.actualMargin === undefined &&
      payload.actualCashFlow === undefined &&
      payload.actualYield === undefined &&
      !payload.note
    ) {
      setError('Нужно указать хотя бы один факт или комментарий.');
      return;
    }

    try {
      setError(null);
      setFeedbackSubmittingRunId(run.id);
      const response = await api.ofs.strategyForecasts.submitFeedback(run.id, payload);
      setRecentRuns((current) =>
        current.map((item) => (item.id === response.data.id ? response.data : item)),
      );
      setFeedbackDialogRun(null);
      setFeedbackRevenueInput('');
      setFeedbackMarginInput('');
      setFeedbackCashFlowInput('');
      setFeedbackYieldInput('');
      setFeedbackNoteInput('');
    } catch (e) {
      setError((e as Error).message ?? 'Не удалось записать фактический результат');
    } finally {
      setFeedbackSubmittingRunId(null);
    }
  }

  function openFeedbackDialog(run: StrategyForecastRunHistoryItem) {
    setFeedbackDialogRun(run);
    setFeedbackRevenueInput('');
    setFeedbackMarginInput('');
    setFeedbackCashFlowInput('');
    setFeedbackYieldInput('');
    setFeedbackNoteInput(run.evaluation.note ?? '');
  }

  const hasScenarioAdjustments = LEVER_OPTIONS.some(
    (option) => Number(leverValues[option.value] || 0) !== 0,
  );
  const scenarioSummary = result?.scenarioDelta
    ? buildScenarioSummary(result)
    : 'После расчёта здесь появится прикладная оценка влияния сценария.';

  return (
    <div className="min-h-screen bg-slate-50 px-8 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm shadow-black/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#717182]">
                <Sigma size={14} />
                Стратегия / Прогнозы
              </div>
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-[#030213]">Прогнозы решений</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-black/10 bg-slate-50 px-2 py-1 text-[11px] font-medium text-[#717182]">База</span>
                  <span className="rounded-md border border-black/10 bg-slate-50 px-2 py-1 text-[11px] font-medium text-[#717182]">Диапазон</span>
                  <span className="rounded-md border border-black/10 bg-slate-50 px-2 py-1 text-[11px] font-medium text-[#717182]">Сценарий</span>
                  <span className="rounded-md border border-black/10 bg-slate-50 px-2 py-1 text-[11px] font-medium text-[#717182]">Риски</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={runForecast}
              disabled={!enabled || !seasonId || loading || domains.length === 0 || (scopeLevel === 'field' && !fieldId.trim())}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#030213] px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TrendingUp size={16} />
              {loading ? 'Построение...' : 'Построить прогноз'}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveCurrentScenario}
              disabled={!enabled || !seasonId || !hasScenarioAdjustments}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#030213] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BookmarkPlus size={15} />
              Сохранить сценарий
            </button>
            <p className="text-[13px] text-[#717182]">
              Сохраняются текущие параметры и рычаги сценария. Приоритетный источник данных: сервер.
            </p>
          </div>
          {!enabled && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              Функция недоступна: отключена в настройках релиза.
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm shadow-black/[0.03]">
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 size={18} className="text-[#030213]" />
                <div>
                  <h2 className="text-lg font-medium text-[#030213]">Параметры расчёта</h2>
                  <p className="text-[13px] text-[#717182]">Базовые фильтры, домены и сценарные рычаги.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Уровень">
                  <select aria-label="Уровень" value={scopeLevel} onChange={(e) => setScopeLevel(e.target.value as ScopeLevel)} className={inputClassName}>
                    <option value="company">Компания</option>
                    <option value="farm">Хозяйство</option>
                    <option value="field">Поле</option>
                  </select>
                </Field>
                <Field label="Сезон">
                  <select
                    aria-label="Сезон"
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                    className={inputClassName}
                    disabled={loadingSeasons}
                  >
                    <option value="">{loadingSeasons ? 'Загрузка...' : 'Выберите сезон'}</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.year} • {season.status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Горизонт">
                  <select aria-label="Горизонт" value={String(horizonDays)} onChange={(e) => setHorizonDays(Number(e.target.value) as 30 | 90 | 180 | 365)} className={inputClassName}>
                    <option value="30">30 дней</option>
                    <option value="90">90 дней</option>
                    <option value="180">180 дней</option>
                    <option value="365">365 дней</option>
                  </select>
                </Field>
                <Field label="ID хозяйства">
                  <input aria-label="ID хозяйства" value={farmId} onChange={(e) => setFarmId(e.target.value)} className={inputClassName} placeholder="опционально" />
                </Field>
                <Field label="ID поля">
                  <input aria-label="ID поля" value={fieldId} onChange={(e) => setFieldId(e.target.value)} className={inputClassName} placeholder={scopeLevel === 'field' ? 'обязательно' : 'опционально'} />
                </Field>
                <Field label="Культура">
                  <input aria-label="Культура" value={crop} onChange={(e) => setCrop(e.target.value)} className={inputClassName} placeholder="например, рапс" />
                </Field>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[12px] font-medium uppercase tracking-widest text-[#717182]">Домены</p>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((domain) => {
                    const active = domains.includes(domain.value);
                    return (
                      <button
                        key={domain.value}
                        type="button"
                        onClick={() => toggleDomain(domain.value)}
                        className={`rounded-full border px-3 py-1.5 text-[13px] transition ${active ? 'border-[#030213] bg-[#030213] text-white' : 'border-black/10 bg-white text-[#030213] hover:bg-slate-50'}`}
                      >
                        {domain.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-black/5 pt-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">Сценарий</p>
                    <p className="text-[13px] text-[#717182]">Измените рычаги, чтобы увидеть отклонение от базового сценария.</p>
                  </div>
                  <input
                    aria-label="Название сценария"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className={`${inputClassName} max-w-xs`}
                    placeholder="Название сценария"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {LEVER_OPTIONS.map((option) => (
                    <Field key={option.value} label={option.label}>
                      <input
                        aria-label={option.label}
                        value={leverValues[option.value]}
                        onChange={(e) =>
                          setLeverValues((current) => ({
                            ...current,
                            [option.value]: e.target.value,
                          }))
                        }
                        type="number"
                        className={inputClassName}
                        placeholder={option.placeholder}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <MetricCard
                title="Базовый сценарий"
                accent="slate"
                values={[
                  { label: 'Выручка', value: formatMoney(result?.baseline.revenue) },
                  { label: 'Маржа', value: formatMoney(result?.baseline.margin) },
                  { label: 'Денежный поток', value: formatMoney(result?.baseline.cashFlow) },
                  { label: 'Индекс риска', value: result ? `${result.baseline.riskScore.toFixed(1)}` : '—' },
                  { label: 'Урожайность', value: result?.baseline.yield !== undefined ? `${result.baseline.yield.toFixed(1)}` : '—' },
                ]}
              />
              <MetricCard
                title="Изменение сценария"
                accent="blue"
                values={[
                  { label: 'Выручка', value: formatSignedMoney(result?.scenarioDelta?.revenue) },
                  { label: 'Маржа', value: formatSignedMoney(result?.scenarioDelta?.margin) },
                  { label: 'Денежный поток', value: formatSignedMoney(result?.scenarioDelta?.cashFlow) },
                  { label: 'Сдвиг риска', value: result?.scenarioDelta ? `${prefixNumber(result.scenarioDelta.riskScore.toFixed(1))}` : '—' },
                  { label: 'Сдвиг урожайности', value: result?.scenarioDelta?.yield !== undefined ? prefixNumber(result.scenarioDelta.yield.toFixed(1)) : '—' },
                ]}
              />
              <MetricCard
                title="Рекомендация"
                accent="emerald"
                values={[
                  { label: 'Уровень риска', value: result ? riskTierLabel(result.riskTier) : '—' },
                  { label: 'Компромисс', value: result?.tradeoff ?? '—' },
                  { label: 'Трасса', value: result?.traceId ?? '—' },
                ]}
                body={result?.recommendedAction ?? 'После расчёта здесь появится рекомендованное действие.'}
              />
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm shadow-black/[0.03]">
              <div className="mb-4 flex gap-2 border-b border-black/10 pb-4">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-3 py-1.5 text-[13px] transition ${activeTab === tab ? 'bg-[#030213] text-white' : 'bg-slate-100 text-[#717182] hover:text-[#030213]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'Прогноз' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <RangeCard title="Выручка" range={result?.range.revenue} />
                  <RangeCard title="Маржа" range={result?.range.margin} />
                  <RangeCard title="Денежный поток" range={result?.range.cashFlow} />
                  <RangeCard title="Урожайность" range={result?.range.yield} metric />
                </div>
              )}

              {activeTab === 'Факторы' && (
                <div className="space-y-3">
                  {(result?.drivers ?? []).map((driver) => (
                    <div key={driver.name} className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-[#030213]">{driver.name}</p>
                          <p className="text-[12px] text-[#717182]">Направление: {driver.direction === 'up' ? 'рост' : 'давление'}</p>
                        </div>
                        <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[12px] font-mono text-[#030213]">
                          {(driver.strength * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {!result && <EmptyState text="После расчёта здесь появятся ключевые драйверы." />}
                </div>
              )}

              {activeTab === 'Сценарии' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                      Сценарная оценка
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#030213]">
                      {scenarioSummary}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
                    <p className="text-[12px] uppercase tracking-widest text-[#717182]">Активный сценарий</p>
                    <p className="mt-2 text-[15px] font-medium text-[#030213]">{scenarioName}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {LEVER_OPTIONS.filter((option) => Number(leverValues[option.value] || 0) !== 0).map((option) => (
                        <div key={option.value} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213]">
                          {option.label}: {prefixNumber(leverValues[option.value])}
                        </div>
                      ))}
                    </div>
                    {LEVER_OPTIONS.every((option) => Number(leverValues[option.value] || 0) === 0) && (
                      <p className="mt-3 text-[13px] text-[#717182]">Изменения рычагов пока не заданы.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[12px] uppercase tracking-widest text-[#717182]">Сохранённые сценарии</p>
                        <p className="mt-1 text-[13px] text-[#717182]">
                          Быстрый возврат к рабочим версиям без ручного переноса рычагов.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {savedScenarios.length > 0 ? (
                        savedScenarios.map((scenario) => (
                          <div
                            key={scenario.id}
                            className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-[14px] font-medium text-[#030213]">{scenario.name}</p>
                                <p className="mt-1 text-[12px] text-[#717182]">
                                  {formatScenarioMeta(scenario, seasons)}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => loadSavedScenario(scenario)}
                                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition hover:bg-white"
                                >
                                  Загрузить
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteSavedScenario(scenario.id)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  <Trash2 size={14} />
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState text="Сохранённых сценариев пока нет. Сформируйте рабочий сценарий и сохраните его из верхней панели." />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Оптимизация' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                      Цель оптимизации
                    </p>
                    <p className="mt-2 text-[15px] font-medium text-[#030213]">
                      {result?.optimizationPreview.objective ?? 'После расчёта здесь появится целевая функция оптимизации.'}
                    </p>
                    <p className="mt-2 text-[13px] text-[#717182]">
                      {result?.optimizationPreview.planningHorizon ?? 'Горизонт будет определён после расчёта.'}
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                      <p className="text-[12px] uppercase tracking-widest text-[#717182]">Ограничения</p>
                      <div className="mt-3 space-y-2">
                        {(result?.optimizationPreview.constraints ?? []).map((constraint) => (
                          <div
                            key={constraint}
                            className="rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-[13px] text-[#030213]"
                          >
                            {constraint}
                          </div>
                        ))}
                        {!result && (
                          <EmptyState text="Сначала выполните расчёт, чтобы увидеть ограничения оптимизации." />
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
                      <p className="text-[12px] uppercase tracking-widest text-[#717182]">Рекомендованные действия</p>
                      <div className="mt-3 space-y-3">
                        {(result?.optimizationPreview.recommendations ?? []).map((recommendation) => (
                          <div
                            key={`${recommendation.action}:${recommendation.confidence}`}
                            className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[14px] font-medium leading-relaxed text-[#030213]">
                                {recommendation.action}
                              </p>
                              <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-wide text-[#717182]">
                                {recommendation.confidence}
                              </span>
                            </div>
                            <p className="mt-2 text-[13px] leading-relaxed text-[#717182]">
                              {recommendation.expectedImpact}
                            </p>
                          </div>
                        ))}
                        {!result && (
                          <EmptyState text="После расчёта здесь появятся оптимизационные рекомендации по бюджету, риску и денежному потоку." />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Риски' && (
                <div className="space-y-3">
                  {result?.degraded && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Расчёт выполнен в ограниченном режиме</p>
                          <ul className="mt-2 space-y-1 text-[12px] text-amber-800">
                            {result.degradationReasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
                    <p className="text-[12px] uppercase tracking-widest text-[#717182]">Ограничения</p>
                    <ul className="mt-3 space-y-2 text-[13px] text-[#030213]">
                      {(result?.limitations ?? []).map((limitation) => (
                        <li key={limitation}>{limitation}</li>
                      ))}
                    </ul>
                    {!result && <EmptyState text="После расчёта здесь появятся ограничения и риски исполнения." />}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm shadow-black/[0.03]">
              <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">Структурные выводы</p>
              <div className="mt-4 space-y-4">
                <Insight title="Рекомендованное действие" body={result?.recommendedAction ?? 'Сначала выполните расчёт.'} />
                <Insight title="Компромисс" body={result?.tradeoff ?? 'После расчёта здесь появится ключевой компромисс.'} />
                <Insight title="Сценарная оценка" body={scenarioSummary} />
                <Insight
                  title="Цель оптимизации"
                  body={result?.optimizationPreview.objective ?? 'После расчёта здесь появится цель оптимизации.'}
                />
                <Insight title="Доказательства" body={(result?.evidence ?? []).join(', ') || 'Источники будут перечислены после расчёта.'} />
                <Insight
                  title="Происхождение данных"
                  body={
                    (result?.lineage ?? [])
                      .map((item) => `${item.source} [${lineageStatusLabel(item.status)}]`)
                      .join(', ') || 'После расчёта здесь появится происхождение доменных сигналов.'
                  }
                />
                <Insight title="Контекст сезона" body={selectedSeason ? `${selectedSeason.year} • ${selectedSeason.status}` : 'Сезон не выбран'} />
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm shadow-black/[0.03]">
              <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">Статус</p>
              <div className="mt-4 space-y-3">
                <StatusRow label="Режим расчёта" value={result?.degraded ? 'ограниченный' : result ? 'штатный' : 'ожидание'} />
                <StatusRow label="Домены" value={formatDomainList(domains)} />
                <StatusRow label="Горизонт" value={`${horizonDays} дней`} />
                <StatusRow label="Сезон" value={selectedSeason ? `${selectedSeason.year}` : '—'} />
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm shadow-black/[0.03]">
              <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">Последние запуски</p>
              <div className="mt-3 grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    aria-label="Фильтр уровня риска в истории"
                    value={historyRiskTierFilter}
                    onChange={(event) =>
                      setHistoryRiskTierFilter(
                        event.target.value as 'all' | 'low' | 'medium' | 'high',
                      )
                    }
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] text-[#030213]"
                  >
                    <option value="all">Все уровни риска</option>
                    <option value="low">низкий</option>
                    <option value="medium">средний</option>
                    <option value="high">высокий</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] text-[#030213]">
                    <input
                      type="checkbox"
                      checked={historyOnlyDegraded}
                      onChange={(event) => setHistoryOnlyDegraded(event.target.checked)}
                    />
                    Только ограниченный режим
                  </label>
                </div>
                <p className="text-[11px] text-[#717182]">
                  Показано {recentRuns.length} из {recentRunsTotal}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {recentRuns.length > 0 ? (
                  recentRuns.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-black/10 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-medium text-[#030213]">
                          {run.scenarioName || 'Базовый запуск'}
                        </p>
                        <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-wide text-[#717182]">
                          {riskTierLabel(run.riskTier)}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-[#717182]">
                        {formatRunMeta(run, seasons)}
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#030213]">
                        {run.recommendedAction}
                      </p>
                      <p className="mt-2 text-[12px] text-[#717182]">
                        {formatRunEvaluation(run)}
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => openFeedbackDialog(run)}
                          disabled={feedbackSubmittingRunId === run.id}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {feedbackSubmittingRunId === run.id
                            ? 'Сохранение...'
                            : run.evaluation.status === 'pending'
                              ? 'Записать факт'
                              : 'Обновить факт'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState text={historyLoading ? 'Загрузка истории...' : 'После первых запусков здесь появится история расчётов и рекомендаций.'} />
                )}
                {recentRunsHasMore && (
                  <button
                    type="button"
                    onClick={() => void loadRecentRuns({ append: true })}
                    disabled={historyLoading}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {historyLoading ? 'Загрузка...' : 'Показать ещё'}
                  </button>
                )}
              </div>
            </section>

            {feedbackDialogRun && (
              <ActionDialog
                title={feedbackDialogRun.evaluation.status === 'pending' ? 'Записать фактический результат' : 'Обновить фактический результат'}
                description="Укажите фактические значения. Достаточно заполнить хотя бы одно поле или комментарий."
                onClose={() => setFeedbackDialogRun(null)}
                onConfirm={() => void submitRunFeedback(feedbackDialogRun)}
                confirmLabel={feedbackSubmittingRunId === feedbackDialogRun.id ? 'Сохранение...' : 'Сохранить'}
                confirmDisabled={feedbackSubmittingRunId === feedbackDialogRun.id}
              >
                <div className="grid grid-cols-1 gap-3">
                  <input
                    value={feedbackRevenueInput}
                    onChange={(event) => setFeedbackRevenueInput(event.target.value)}
                    type="number"
                    className={inputClassName}
                    placeholder="Фактическая выручка (RUB)"
                  />
                  <input
                    value={feedbackMarginInput}
                    onChange={(event) => setFeedbackMarginInput(event.target.value)}
                    type="number"
                    className={inputClassName}
                    placeholder="Фактическая маржа (RUB)"
                  />
                  <input
                    value={feedbackCashFlowInput}
                    onChange={(event) => setFeedbackCashFlowInput(event.target.value)}
                    type="number"
                    className={inputClassName}
                    placeholder="Фактический денежный поток (RUB)"
                  />
                  <input
                    value={feedbackYieldInput}
                    onChange={(event) => setFeedbackYieldInput(event.target.value)}
                    type="number"
                    className={inputClassName}
                    placeholder="Фактическая урожайность"
                  />
                  <textarea
                    value={feedbackNoteInput}
                    onChange={(event) => setFeedbackNoteInput(event.target.value)}
                    className="min-h-[84px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[14px] text-[#030213] outline-none transition focus:border-black/30"
                    placeholder="Комментарий (опционально)"
                  />
                </div>
              </ActionDialog>
            )}

            {error && (
              <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-[13px] text-red-700">
                {error}
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-medium uppercase tracking-widest text-[#717182]">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({
  title,
  accent,
  values,
  body,
}: {
  title: string;
  accent: 'slate' | 'blue' | 'emerald';
  values: Array<{ label: string; value: string }>;
  body?: string;
}) {
  const accentClass =
    accent === 'blue'
      ? 'border-blue-100 bg-blue-50/60'
      : accent === 'emerald'
        ? 'border-emerald-100 bg-emerald-50/60'
        : 'border-black/10 bg-white';

  return (
    <div className={`rounded-3xl border p-5 shadow-sm shadow-black/[0.03] ${accentClass}`}>
      <p className="text-[12px] font-medium uppercase tracking-widest text-[#717182]">{title}</p>
      <div className="mt-4 space-y-3">
        {values.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4">
            <span className="text-[12px] text-[#717182]">{item.label}</span>
            <span className="text-right text-[14px] font-medium text-[#030213]">{item.value}</span>
          </div>
        ))}
      </div>
      {body && <p className="mt-4 border-t border-black/5 pt-4 text-[13px] leading-relaxed text-[#030213]">{body}</p>}
    </div>
  );
}

function RangeCard({
  title,
  range,
  metric = false,
}: {
  title: string;
  range?: { p10: number; p50: number; p90: number };
  metric?: boolean;
}) {
  if (!range) {
    return <EmptyState text={`${title}: данные появятся после расчёта.`} />;
  }
  return (
    <div className="rounded-2xl border border-black/10 bg-slate-50 p-4">
      <p className="text-[13px] font-medium text-[#030213]">{title}</p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
        <span className="rounded-xl bg-white px-3 py-2 text-center text-[#717182]">P10<br />{metric ? range.p10.toFixed(1) : formatMoney(range.p10)}</span>
        <span className="rounded-xl bg-white px-3 py-2 text-center font-medium text-[#030213]">P50<br />{metric ? range.p50.toFixed(1) : formatMoney(range.p50)}</span>
        <span className="rounded-xl bg-white px-3 py-2 text-center text-[#717182]">P90<br />{metric ? range.p90.toFixed(1) : formatMoney(range.p90)}</span>
      </div>
    </div>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-slate-50 p-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-[#030213]">{body}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3 text-[13px] last:border-0 last:pb-0">
      <span className="text-[#717182]">{label}</span>
      <span className="font-medium text-[#030213]">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-4 py-5 text-[13px] text-[#717182]">
      {text}
    </div>
  );
}

function ActionDialog({
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-2xl">
        <h3 className="text-[16px] font-medium text-[#030213]">{title}</h3>
        <p className="mt-1 text-[13px] text-[#717182]">{description}</p>
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-[#030213] transition hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="rounded-lg bg-[#030213] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatMoney(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSignedMoney(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${value > 0 ? '+' : value < 0 ? '' : ''}${formatMoney(value)}`;
}

function prefixNumber(value: string) {
  return value.startsWith('-') || value === '0.0' || value === '0' ? value : `+${value}`;
}

function riskTierLabel(value: string) {
  const map: Record<string, string> = {
    low: 'низкий',
    medium: 'средний',
    high: 'высокий',
  };
  return map[value] ?? value;
}

function lineageStatusLabel(value: 'ok' | 'degraded' | 'not_requested' | 'missing') {
  const map: Record<'ok' | 'degraded' | 'not_requested' | 'missing', string> = {
    ok: 'штатно',
    degraded: 'ограниченно',
    not_requested: 'не запрашивалось',
    missing: 'нет данных',
  };
  return map[value] ?? value;
}

function formatDomainList(domains: ForecastDomain[]) {
  const map: Record<ForecastDomain, string> = {
    agro: 'агро',
    economics: 'экономика',
    finance: 'финансы',
    risk: 'риски',
  };
  return domains.map((domain) => map[domain] ?? domain).join(', ');
}

function buildScenarioSummary(result: StrategyForecastRunResponse): string {
  if (!result.scenarioDelta) {
    return 'Сценарий пока не рассчитан.';
  }

  const strongestDirection =
    Math.abs(result.scenarioDelta.margin) >= Math.abs(result.scenarioDelta.cashFlow)
      ? `маржа ${formatSignedMoney(result.scenarioDelta.margin)}`
      : `денежный поток ${formatSignedMoney(result.scenarioDelta.cashFlow)}`;
  const riskFragment =
    result.scenarioDelta.riskScore === 0
      ? 'без сдвига по риску'
      : `риск ${prefixNumber(result.scenarioDelta.riskScore.toFixed(1))}`;

  return `Сценарий даёт ${strongestDirection}, выручка ${formatSignedMoney(result.scenarioDelta.revenue)} и ${riskFragment}. ${result.tradeoff}`;
}

function formatScenarioMeta(
  scenario: StrategyForecastScenarioRecord,
  seasons: SeasonListItem[],
): string {
  const scopeLabelMap: Record<ScopeLevel, string> = {
    company: 'компания',
    farm: 'хозяйство',
    field: 'поле',
  };
  const season = seasons.find((item) => item.id === scenario.seasonId);
  const seasonLabel = season ? `${season.year}` : scenario.seasonId;
  return [
    scopeLabelMap[scenario.scopeLevel] ?? scenario.scopeLevel,
    `сезон ${seasonLabel}`,
    `${scenario.horizonDays} дн.`,
    `${scenario.domains.length} доменов`,
    `сохранено ${new Date(scenario.updatedAt).toLocaleString('ru-RU')}`,
  ].join(' • ');
}

function formatRunMeta(
  run: StrategyForecastRunHistoryItem,
  seasons: SeasonListItem[],
): string {
  const scopeLabelMap: Record<ScopeLevel, string> = {
    company: 'компания',
    farm: 'хозяйство',
    field: 'поле',
  };
  const season = seasons.find((item) => item.id === run.seasonId);
  const seasonLabel = season ? `${season.year}` : run.seasonId;
  return [
    scopeLabelMap[run.scopeLevel] ?? run.scopeLevel,
    `сезон ${seasonLabel}`,
    `${run.horizonDays} дн.`,
    run.degraded ? 'ограниченный' : 'штатный',
    new Date(run.createdAt).toLocaleString('ru-RU'),
  ].join(' • ');
}

function formatRunEvaluation(run: StrategyForecastRunHistoryItem): string {
  if (run.evaluation.status === 'pending') {
    return 'Ожидается обратная связь';
  }

  const deltas = [
    run.evaluation.revenueErrorPct !== null && run.evaluation.revenueErrorPct !== undefined
      ? `выручка ${prefixNumber(run.evaluation.revenueErrorPct.toFixed(1))}%`
      : null,
    run.evaluation.marginErrorPct !== null && run.evaluation.marginErrorPct !== undefined
      ? `маржа ${prefixNumber(run.evaluation.marginErrorPct.toFixed(1))}%`
      : null,
    run.evaluation.cashFlowErrorPct !== null && run.evaluation.cashFlowErrorPct !== undefined
      ? `денежный поток ${prefixNumber(run.evaluation.cashFlowErrorPct.toFixed(1))}%`
      : null,
    run.evaluation.yieldErrorPct !== null && run.evaluation.yieldErrorPct !== undefined
      ? `урожайность ${prefixNumber(run.evaluation.yieldErrorPct.toFixed(1))}%`
      : null,
  ].filter(Boolean);

  if (deltas.length === 0) {
    return 'Обратная связь записана';
  }

  return `Отклонение факта: ${deltas.join(', ')}`;
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function persistSavedScenarios(
  nextScenarios: StrategyForecastScenarioRecord[],
  setSavedScenarios: React.Dispatch<React.SetStateAction<StrategyForecastScenarioRecord[]>>,
) {
  setSavedScenarios(nextScenarios);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      SAVED_SCENARIOS_STORAGE_KEY,
      JSON.stringify(nextScenarios),
    );
  }
}

function loadScenarioShadowCache(): StrategyForecastScenarioRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SAVED_SCENARIOS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.slice(0, 20).map((item) => ({
          ...item,
          leverValues: normalizeLeverValues(item?.leverValues),
        }))
      : [];
  } catch {
    return [];
  }
}

function normalizeLeverValues(
  leverValues?: Partial<Record<ScenarioLever, string>>,
): Record<ScenarioLever, string> {
  return {
    ...EMPTY_LEVER_VALUES,
    ...leverValues,
  };
}

const inputClassName =
  'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[14px] text-[#030213] outline-none transition focus:border-black/30';
