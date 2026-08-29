import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { shellApi } from '@/lib/core-client';
import { CloseIcon, SearchIcon } from '../components/Icons';
import { ErrorBanner } from '../components/Feedback';
import type { Project } from '../types';
import { readProjectResponse } from '../api-shapes';
import { asRecord, asString, getErrorMessage, inputClass, labelClass } from '../utils';

interface SpeciesOption { 
  label: string; 
  taxonomyId: string; 
  scientificName?: string;
  commonName?: string;
}

export interface SelectedSpeciesItem {
  species: string;
  taxonomyId: string;
  commonName?: string;
}

function normalizeSpecies(value: unknown): SpeciesOption | null {
  const item = asRecord(value);
  if (!item) return null;
  const scientificName = asString(item.scientificName);
  const commonName = asString(item.commonName) ?? asString(item.name);
  const label = scientificName ?? commonName ?? asString(item.label);
  const taxonomy = item.taxonomyId ?? item.taxonomy_id ?? item.id;
  if (!label || (typeof taxonomy !== 'string' && typeof taxonomy !== 'number')) return null;
  return { label, taxonomyId: String(taxonomy), scientificName, commonName };
}

function SpeciesSelector({
  scope,
  selectedList,
  setSelectedList,
  species,
  setSpecies,
  speciesTaxonomyId,
  setSpeciesTaxonomyId,
  disabled
}: {
  scope: string;
  selectedList: SelectedSpeciesItem[];
  setSelectedList: React.Dispatch<React.SetStateAction<SelectedSpeciesItem[]>>;
  species: string;
  setSpecies: (v: string) => void;
  speciesTaxonomyId: string;
  setSpeciesTaxonomyId: (v: string) => void;
  disabled: boolean;
}) {
  const [suggestions, setSuggestions] = useState<SpeciesOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isDeExtinction = scope === 'De-Extinction';
  const isMaxReached = isDeExtinction && selectedList.length >= 2;

  useEffect(() => {
    if (disabled || isMaxReached) {
      setIsOpen(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const query = encodeURIComponent(species.trim());
        const scopeParam = encodeURIComponent(scope);
        const res = await fetch(`/api/species/search?q=${query}&scope=${scopeParam}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.results || [];
        setSuggestions(
          results
            .map(normalizeSpecies)
            .filter((item: SpeciesOption | null): item is SpeciesOption => item !== null)
            .filter((item: SpeciesOption) => !selectedList.some((s) => s.taxonomyId === item.taxonomyId))
            .slice(0, 6)
        );
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [species, scope, disabled, isMaxReached, selectedList]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (item: SpeciesOption | { scientificName?: string; commonName?: string; label: string; taxonomyId: string }) => {
    const name = item.scientificName || item.commonName || item.label;
    if (isDeExtinction) {
      if (selectedList.length < 2 && !selectedList.some(s => s.species.toLowerCase() === name.toLowerCase())) {
        setSelectedList(prev => [...prev, { species: name, taxonomyId: item.taxonomyId, commonName: item.commonName }]);
      }
      setSpecies('');
      setSpeciesTaxonomyId('');
      setIsOpen(false);
    } else {
      setSpecies(name);
      setSpeciesTaxonomyId(item.taxonomyId);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        handleSelectOption(suggestions[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const removeSelectedSpecies = (index: number) => {
    setSelectedList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block">
        <span className="flex items-center justify-between">
          <span className={labelClass}>Species</span>
          {isDeExtinction && (
            <span className="text-xs font-semibold text-amber-rust dark:text-amber">
              {selectedList.length === 0 ? '1 to 2 species required' : `${selectedList.length}/2 selected`}
            </span>
          )}
        </span>

        {/* Selected chips for De-Extinction */}
        {isDeExtinction && selectedList.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {selectedList.map((item, index) => (
              <span
                key={`${item.taxonomyId}-${item.species}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-deep/30 bg-amber-pale/40 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                <span>
                  <i>{item.species}</i>
                  {item.commonName && <span className="ml-1 font-normal opacity-80">({item.commonName})</span>}
                </span>
                <button
                  type="button"
                  onClick={() => removeSelectedSpecies(index)}
                  className="ml-1 text-text-light transition hover:text-red-600 dark:text-text-dark dark:hover:text-red-400"
                  aria-label={`Remove ${item.species}`}
                >
                  <CloseIcon size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {!isMaxReached ? (
          <span className="relative block">
            <SearchIcon
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light/60 dark:text-text-dark/60"
            />
            <input
              required={isDeExtinction ? selectedList.length === 0 : true}
              autoComplete="off"
              disabled={disabled}
              className={`${inputClass} pl-10 pr-10 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={species}
              onChange={(event) => {
                setSpecies(event.target.value);
                if (!isDeExtinction) setSpeciesTaxonomyId('');
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDeExtinction
                  ? selectedList.length === 1
                    ? 'Search 2nd surrogate / reference species (optional)'
                    : 'Search extinct species (1 or 2 species)'
                  : 'Search scientific or common name'
              }
            />
            {searching && (
              <span className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-amber-deep border-t-transparent" />
            )}
          </span>
        ) : (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
            ✓ Maximum 2 species selected for de-extinction. Remove a species above to search for another.
          </div>
        )}
      </label>

      {/* Autocomplete Dropdown */}
      {isOpen && !isMaxReached && !searching && suggestions.length === 0 && species.trim().length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#201A14]">
          <button
            type="button"
            onClick={() => {
              handleSelectOption({ label: species.trim(), taxonomyId: 'custom' });
            }}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-amber-pale/25 dark:hover:bg-white/10 dark:text-white"
          >
            <span className="font-medium">
              Use &ldquo;<i>{species.trim()}</i>&rdquo;
            </span>
            <span className="ml-2 text-xs font-semibold text-amber-rust dark:text-amber-300">
              Custom organism
            </span>
          </button>
        </div>
      )}

      {isOpen && !isMaxReached && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#201A14]">
          {suggestions.map((item, index) => (
            <button
              type="button"
              key={`${item.taxonomyId}-${item.label}`}
              onMouseEnter={() => setFocusedIndex(index)}
              onClick={() => handleSelectOption(item)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm dark:text-white ${
                focusedIndex === index ? 'bg-amber-pale/25 dark:bg-white/10' : 'hover:bg-amber-pale/25 dark:hover:bg-white/10'
              }`}
            >
              <span className="font-medium">
                {item.scientificName ? <i className="mr-1">{item.scientificName}</i> : null}
                {item.commonName ? (
                  <span className="text-text-light dark:text-text-dark/80">({item.commonName})</span>
                ) : (
                  !item.scientificName && item.label
                )}
              </span>
              <span className="ml-2 text-xs text-text-light dark:text-text-dark">
                Taxonomy {item.taxonomyId}
              </span>
            </button>
          ))}
          {species.trim().length > 0 &&
            !suggestions.some(
              (s) =>
                s.scientificName?.toLowerCase() === species.trim().toLowerCase() ||
                s.commonName?.toLowerCase() === species.trim().toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => handleSelectOption({ label: species.trim(), taxonomyId: 'custom' })}
                className="flex w-full items-center justify-between border-t border-ink/5 px-4 py-2.5 text-left text-xs text-text-light hover:bg-amber-pale/25 dark:border-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <span>Or use custom entry: &ldquo;<i>{species.trim()}</i>&rdquo;</span>
                <span className="font-medium text-amber-rust dark:text-amber-300">Custom</span>
              </button>
            )}
        </div>
      )}

      {/* Status helper text */}
      {isDeExtinction ? (
        <p className="mt-1.5 text-xs text-text-light dark:text-text-dark/70">
          {selectedList.length === 0
            ? 'De-Extinction projects require 1 or 2 species (e.g. extinct target + optional surrogate host).'
            : selectedList.length === 1
              ? '1 species selected. You may optionally add a second species for surrogate comparison.'
              : '2 species selected (target + surrogate host).'}
        </p>
      ) : (
        speciesTaxonomyId &&
        !isOpen && (
          <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            {speciesTaxonomyId === 'custom'
              ? 'Custom organism selected.'
              : 'Species matched and taxonomy recorded.'}
          </p>
        )
      )}
    </div>
  );
}

export interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const SCOPE_OPTIONS = [
  'Conservation',
  'De-Extinction',
  'Agriculture',
  'Synthetic Biology',
  'Population Control',
  'Precision Medicine',
];

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [scope, setScope] = useState('Conservation');
  const [species, setSpecies] = useState('');
  const [speciesTaxonomyId, setSpeciesTaxonomyId] = useState('');
  const [selectedList, setSelectedList] = useState<SelectedSpeciesItem[]>([]);
  const [objective, setObjective] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isDeExtinction = scope === 'De-Extinction';

  useEffect(() => {
    if (scope === 'Precision Medicine') {
      setSpecies('Homo sapiens');
      setSpeciesTaxonomyId('9606');
      setSelectedList([]);
    } else if (scope === 'De-Extinction') {
      if (species && speciesTaxonomyId && selectedList.length === 0) {
        setSelectedList([{ species, taxonomyId: speciesTaxonomyId }]);
        setSpecies('');
        setSpeciesTaxonomyId('');
      }
    } else {
      if (selectedList.length > 0) {
        setSpecies(selectedList[0].species);
        setSpeciesTaxonomyId(selectedList[0].taxonomyId);
        setSelectedList([]);
      } else if (speciesTaxonomyId === '9606' && species === 'Homo sapiens') {
        setSpecies('');
        setSpeciesTaxonomyId('');
      }
    }
  }, [scope]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setName('');
    setScope('Conservation');
    setSpecies('');
    setSpeciesTaxonomyId('');
    setSelectedList([]);
    setObjective('');
    setError('');
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    let finalSpecies = species.trim();
    let finalTaxonomyId = speciesTaxonomyId.trim();

    if (isDeExtinction) {
      if (selectedList.length === 0) {
        setError('De-Extinction projects require a minimum of 1 species and a maximum of 2 species.');
        return;
      }
      finalSpecies = selectedList.map((s) => s.species).join(', ');
      finalTaxonomyId = selectedList.map((s) => s.taxonomyId).join(', ');
    } else {
      if (!finalTaxonomyId) {
        setError('Choose a species from the suggestions so its taxonomy can be recorded.');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const project = readProjectResponse(
        await shellApi<unknown>('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            species: finalSpecies,
            speciesTaxonomyId: finalTaxonomyId,
            scope,
            objective: objective.trim(),
          }),
        })
      );
      if (!project) throw new Error('The project response was invalid.');
      onCreated(project);
      resetAndClose();
    } catch (reason) {
      setError(getErrorMessage(reason, 'The project could not be created.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = isDeExtinction
    ? Boolean(name.trim() && selectedList.length >= 1 && selectedList.length <= 2 && objective.trim())
    : Boolean(name.trim() && speciesTaxonomyId && objective.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm dark:bg-black/70"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-bg-light shadow-2xl dark:border dark:border-white/10 dark:bg-[#18130E]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-ink/10 bg-bg-light/95 px-6 py-5 backdrop-blur dark:border-white/10 dark:bg-[#18130E]/95 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-rust dark:text-amber">New workspace</p>
            <h2 id="create-project-title" className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-white">
              Create a project
            </h2>
          </div>
          <button
            onClick={resetAndClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-text-light hover:bg-ink/5 hover:text-ink dark:text-text-dark dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-6 sm:px-8">
          <p className="mb-6 text-sm leading-6 text-text-light dark:text-text-dark">
            These four fields define the research context and cannot be changed after creation.
          </p>
          {error && (
            <div className="mb-5">
              <ErrorBanner>{error}</ErrorBanner>
            </div>
          )}
          <div className="space-y-5">
            <label className="block">
              <span className={labelClass}>Project name</span>
              <input
                autoFocus
                required
                maxLength={80}
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mammoth revival & adaptation screen"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Scope</span>
              <select
                required
                className={inputClass}
                value={scope}
                onChange={(event) => setScope(event.target.value)}
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="dark:bg-[#18130E]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <SpeciesSelector
              scope={scope}
              selectedList={selectedList}
              setSelectedList={setSelectedList}
              species={species}
              setSpecies={setSpecies}
              speciesTaxonomyId={speciesTaxonomyId}
              setSpeciesTaxonomyId={setSpeciesTaxonomyId}
              disabled={scope === 'Precision Medicine'}
            />

            <label className="block">
              <span className={labelClass}>Objective</span>
              <textarea
                required
                maxLength={500}
                rows={4}
                className={`${inputClass} resize-none`}
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                placeholder="Describe the biological outcome this project should optimize for."
              />
              <span className="mt-1.5 block text-right text-xs text-text-light dark:text-text-dark">
                {objective.length}/500
              </span>
            </label>
          </div>
          <div className="mt-7 flex justify-end gap-3 border-t border-ink/10 pt-6 dark:border-white/10">
            <Button variant="ghost" onClick={resetAndClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !isFormValid}
            >
              {submitting ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;
