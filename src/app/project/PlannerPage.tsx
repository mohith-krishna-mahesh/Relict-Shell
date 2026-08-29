import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, SegmentedControl, Slider, Toggle } from '@/components/ui';
import { getGenes, startRun } from '@/lib/core-client';
import { ErrorBanner } from '../components/Feedback';
import { CheckIcon, CloseIcon, SearchIcon, SparkIcon, TargetIcon } from '../components/Icons';
import { asRecord, asString, getErrorMessage, inputClass, labelClass } from '../utils';
import { useProject } from './ProjectLayout';

interface GeneOption {
  id: string;
  symbol: string;
  description?: string;
  species?: string;
}

type Preset = 'minimal' | 'redundant';

function normalizeGene(value: unknown, speciesName: string): GeneOption | null {
  const item = asRecord(value);
  if (!item) return null;
  const symbol = asString(item.symbol) ?? asString(item.name) ?? asString(item.label);
  if (!symbol) return null;
  return {
    id: `${speciesName}:${asString(item.id) ?? symbol}`,
    symbol,
    description: asString(item.description) ?? asString(item.summary),
    species: speciesName,
  };
}

function SpeciesGeneSection({
  speciesName,
  selectedGenes,
  onAddGene,
  onRemoveGene,
  onError,
  isMultiSpecies,
}: {
  speciesName: string;
  selectedGenes: GeneOption[];
  onAddGene: (gene: GeneOption) => void;
  onRemoveGene: (geneId: string) => void;
  onError: (err: string) => void;
  isMultiSpecies: boolean;
}) {
  const [geneQuery, setGeneQuery] = useState('');
  const [geneOptions, setGeneOptions] = useState<GeneOption[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (geneQuery.trim().length < 2) {
      setGeneOptions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const raw = await getGenes(geneQuery.trim(), speciesName);
        const list = Array.isArray(raw) ? raw : [];
        setGeneOptions(
          list
            .map((item) => normalizeGene(item, speciesName))
            .filter((item): item is GeneOption => item !== null)
            .filter((option) => !selectedGenes.some((gene) => gene.id === option.id))
            .slice(0, 8)
        );
      } catch (err) {
        setGeneOptions([]);
        onError(getErrorMessage(err, `Gene lookup failed for ${speciesName}.`));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [geneQuery, speciesName, selectedGenes, onError]);

  return (
    <Card className="dark:border-white/10 dark:bg-[#18130E]">
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-[#140D07] dark:text-white">
            {isMultiSpecies ? (
              <span>
                Candidate genes — <i className="text-[#B25A12] dark:text-[#FCBA48] font-medium">{speciesName}</i>
              </span>
            ) : (
              'Candidate genes'
            )}
          </h2>
          {isMultiSpecies && (
            <span className="rounded-lg bg-[#FFE49E]/60 px-2.5 py-1 text-xs font-semibold text-[#B25A12] dark:bg-white/10 dark:text-[#FCBA48]">
              {selectedGenes.length} {selectedGenes.length === 1 ? 'gene' : 'genes'} selected
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]">
          {isMultiSpecies
            ? `Identify target alleles and seed pathways specific to ${speciesName}.`
            : `Optional seeds in ${speciesName} focus the graph without excluding adjacent evidence.`}
        </p>
      </div>

      <div className="relative">
        <label>
          <span className={labelClass}>Search genes in {speciesName}</span>
          <span className="relative block">
            <SearchIcon
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A3B2A]/70 dark:text-[#E2D5C3]/70"
            />
            <input
              className={`${inputClass} pl-10 dark:bg-[#140D07]`}
              value={geneQuery}
              onChange={(event) => setGeneQuery(event.target.value)}
              placeholder={`Search symbol or function in ${speciesName}`}
            />
            {searching && (
              <span className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#EE8E28] border-t-transparent" />
            )}
          </span>
        </label>

        {geneOptions.length > 0 && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#140D07]/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#1C1610]">
            {geneOptions.map((gene) => (
              <button
                type="button"
                key={gene.id}
                onClick={() => {
                  onAddGene(gene);
                  setGeneQuery('');
                  setGeneOptions([]);
                }}
                className="block w-full px-4 py-3 text-left hover:bg-[#FFE49E]/20 dark:hover:bg-white/10"
              >
                <span className="text-sm font-semibold text-[#140D07] dark:text-white">{gene.symbol}</span>
                {gene.description && (
                  <span className="ml-3 text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                    {gene.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex min-h-10 flex-wrap gap-2">
        {selectedGenes.length ? (
          selectedGenes.map((gene) => (
            <span
              key={gene.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#140D07] px-2.5 py-1.5 text-xs font-semibold text-[#FBF6EE] shadow-sm dark:bg-white/15 dark:text-white"
            >
              {gene.symbol}
              <button
                type="button"
                onClick={() => onRemoveGene(gene.id)}
                className="text-[#E2D5C3] transition hover:text-white"
                aria-label={`Remove ${gene.symbol}`}
              >
                <CloseIcon size={13} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
            No seed genes selected for {speciesName}
          </span>
        )}
      </div>
    </Card>
  );
}

export function PlannerPage() {
  const project = useProject();
  const navigate = useNavigate();
  const [objective, setObjective] = useState(project.objective);

  const speciesList = useMemo(
    () => project.species.split(',').map((s) => s.trim()).filter(Boolean),
    [project.species]
  );

  const [selectedGenesBySpecies, setSelectedGenesBySpecies] = useState<Record<string, GeneOption[]>>({});
  const [maxEdits, setMaxEdits] = useState(6);
  const [preserveFertility, setPreserveFertility] = useState(true);
  const [maximizeDiversity, setMaximizeDiversity] = useState(true);
  const [presets, setPresets] = useState<Preset[]>(['minimal']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allSelectedGenes = useMemo(
    () => Object.values(selectedGenesBySpecies).flat(),
    [selectedGenesBySpecies]
  );

  const handleAddGene = (species: string, gene: GeneOption) => {
    setSelectedGenesBySpecies((prev) => ({
      ...prev,
      [species]: [...(prev[species] || []), gene],
    }));
  };

  const handleRemoveGene = (species: string, geneId: string) => {
    setSelectedGenesBySpecies((prev) => ({
      ...prev,
      [species]: (prev[species] || []).filter((g) => g.id !== geneId),
    }));
  };

  const readiness = useMemo(() => [Boolean(objective.trim())], [objective]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await startRun({
        projectId: project.id,
        species: project.species,
        research_objective: objective.trim(),
        candidate_genes: allSelectedGenes.map((gene) => gene.symbol),
        constraints: {
          max_edits: maxEdits,
          preserve_fertility: preserveFertility,
          maximize_diversity: maximizeDiversity,
        },
        presets,
      });
      const result = asRecord(response);
      const runId =
        asString(result?.run_id) ??
        asString(result?.coreRunId) ??
        asString(result?.id) ??
        asString(result?.localRunId);
      navigate(runId ? `../knowledge-graph?run=${encodeURIComponent(runId)}` : '../knowledge-graph');
    } catch (reason) {
      setError(
        getErrorMessage(
          reason,
          'The research run could not be started. Check Relict Core connection in Settings.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#B25A12] dark:text-[#FCBA48]">
            Run planner
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#140D07] dark:text-white sm:text-4xl">
            Shape the investigation
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4A3B2A] dark:text-[#E2D5C3]">
            Set the research objective and intervention constraints.
          </p>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="dark:border-white/10 dark:bg-[#18130E]">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFE49E]/75 text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]">
                  <TargetIcon size={19} />
                </span>
                <div>
                  <h2 className="font-semibold text-[#140D07] dark:text-white">Research intent</h2>
                  <p className="mt-0.5 text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                    Tell Core what biological outcome to optimize.
                  </p>
                </div>
              </div>
              <label className="block">
                <span className={labelClass}>Run objective</span>
                <textarea
                  required
                  rows={5}
                  maxLength={10000}
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  className={`${inputClass} resize-none text-base leading-7 dark:bg-[#140D07]`}
                />
                <span className="mt-1.5 block text-right text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                  {objective.length}/10,000
                </span>
              </label>
            </Card>

            {/* Independent candidate gene section for each selected species */}
            {speciesList.map((speciesName) => (
              <SpeciesGeneSection
                key={speciesName}
                speciesName={speciesName}
                selectedGenes={selectedGenesBySpecies[speciesName] || []}
                onAddGene={(gene) => handleAddGene(speciesName, gene)}
                onRemoveGene={(geneId) => handleRemoveGene(speciesName, geneId)}
                onError={setError}
                isMultiSpecies={speciesList.length > 1}
              />
            ))}

            <Card className="space-y-6 dark:border-white/10 dark:bg-[#18130E]">
              <SegmentedControl
                label="Planning presets"
                options={[
                  { label: 'Minimal edits', value: 'minimal' },
                  { label: 'Redundant paths', value: 'redundant' },
                ]}
                selected={presets}
                onChange={setPresets}
              />
              <Slider label="Maximum edits" value={maxEdits} min={0} max={20} onChange={setMaxEdits} />
              <Toggle label="Preserve fertility" checked={preserveFertility} onChange={setPreserveFertility} />
              <Toggle label="Maximize genetic diversity" checked={maximizeDiversity} onChange={setMaximizeDiversity} />
            </Card>
          </div>

          <aside className="sticky top-6">
            <Card className="p-0 dark:border-white/10 dark:bg-[#18130E]">
              <div className="border-b border-[#140D07]/10 p-5 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-[#4A3B2A] dark:text-[#E2D5C3]">
                  Run summary
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#140D07] dark:text-white">Ready to investigate</h2>
              </div>
              <dl className="space-y-4 p-5 text-sm">
                <div>
                  <dt className="text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                    {speciesList.length > 1 ? 'Target & Reference Species' : 'Species'}
                  </dt>
                  <dd className="mt-1 space-y-1 font-medium italic text-[#140D07] dark:text-white">
                    {speciesList.map((sp) => (
                      <p key={sp} className="break-words leading-snug">
                        {sp}
                      </p>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">Scope</dt>
                  <dd className="mt-1 font-medium text-[#140D07] dark:text-white">{project.scope}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">Seed genes</dt>
                  <dd className="mt-1 font-medium text-[#140D07] dark:text-white">
                    {allSelectedGenes.length ? (
                      <div>
                        <span>{allSelectedGenes.length} total</span>
                        {speciesList.length > 1 && (
                          <ul className="mt-1 space-y-0.5 text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                            {speciesList.map((sp) => (
                              <li key={sp}>
                                <i>{sp}</i>: {(selectedGenesBySpecies[sp] || []).length}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      'Open discovery'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">Maximum edits</dt>
                  <dd className="mt-1 font-medium text-[#140D07] dark:text-white">{maxEdits}</dd>
                </div>
              </dl>
              <div className="border-t border-[#140D07]/10 p-5 dark:border-white/10">
                <ul className="mb-5 space-y-2 text-xs text-[#4A3B2A] dark:text-[#E2D5C3]">
                  {readiness.map((ready) => (
                    <li key="objective" className="flex items-center gap-2">
                      <span
                        className={`grid h-4 w-4 place-items-center rounded-full ${
                          ready
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-[#140D07]/10 dark:bg-white/10'
                        }`}
                      >
                        {ready && <CheckIcon size={11} />}
                      </span>
                      Objective provided
                    </li>
                  ))}
                </ul>
                <Button type="submit" className="w-full" disabled={submitting || readiness.some((ready) => !ready)}>
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{' '}
                      Starting run…
                    </>
                  ) : (
                    <>
                      <SparkIcon size={17} /> Start research run
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </aside>
        </form>
      </div>
    </main>
  );
}

export default PlannerPage;
