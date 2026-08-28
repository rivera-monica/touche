'use client';

import { useState } from 'react';
import type { Candle, CandleDraft } from '@/lib/types';
import { MAX_SEASONAL_TAGS, PRIMARY_STATUSES, SECONDARY_STATUSES } from '@/lib/types';
import { getChildren } from '@/lib/candleHelpers';

interface FormState {
  number: string;
  name: string;
  primary_status: string;
  secondary_statuses: string[];
  final_stamp: string;
  family: string;
  derived_from: string;
  ingredients: string[];
  fragrance_load: string;
  batch_size: string;
  label: string;
  wax: string;
  wick: string;
  tempCombined: string;
  depth: string;
  notes: string;
  seasonal_tags: string[];
}

function toFormState(c: Candle | CandleDraft): FormState {
  return {
    number: c.number,
    name: c.name,
    primary_status: c.primary_status || 'Pending Creation',
    secondary_statuses: c.secondary_statuses || [],
    final_stamp: c.final_stamp,
    family: c.family,
    derived_from: c.derived_from || '',
    ingredients: c.ingredients || [],
    fragrance_load: c.fragrance_load,
    batch_size: c.batch_size,
    label: c.label,
    wax: c.wax,
    wick: c.wick,
    tempCombined: (c.pour_temp || '') + (c.add_temp ? ' / ' + c.add_temp : ''),
    depth: c.depth,
    notes: c.notes,
    seasonal_tags: c.seasonal_tags || [],
  };
}

export default function CandleModal({
  candle,
  allCandles,
  onSave,
  onDelete,
  onClose,
}: {
  candle: Candle | null;
  allCandles: Candle[];
  onSave: (draft: Partial<Candle>, id: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const isNew = !candle;
  const base = candle ?? {
    ...blankDraft(),
  };
  const [form, setForm] = useState<FormState>(() => toFormState(base));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const children = candle ? getChildren(allCandles, candle.number) : [];

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateIngredient(i: number, value: string) {
    setForm((f) => {
      const next = [...f.ingredients];
      next[i] = value;
      return { ...f, ingredients: next };
    });
  }

  function removeIngredient(i: number) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  }

  function addIngredient() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ''] }));
  }

  function updateSeasonalTag(i: number, value: string) {
    setForm((f) => {
      const next = [...f.seasonal_tags];
      next[i] = value;
      return { ...f, seasonal_tags: next };
    });
  }

  function removeSeasonalTag(i: number) {
    setForm((f) => ({ ...f, seasonal_tags: f.seasonal_tags.filter((_, idx) => idx !== i) }));
  }

  function addSeasonalTag() {
    setForm((f) =>
      f.seasonal_tags.length >= MAX_SEASONAL_TAGS
        ? f
        : { ...f, seasonal_tags: [...f.seasonal_tags, ''] }
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const [pour, add] = form.tempCombined.split('/').map((s) => (s ? s.trim() : ''));
      const draft: Partial<Candle> = {
        number: form.number.trim(),
        name: form.name.trim(),
        primary_status: form.primary_status.trim(),
        secondary_statuses: form.secondary_statuses,
        final_stamp: form.final_stamp.trim(),
        family: form.family.trim(),
        derived_from: form.derived_from.trim(),
        ingredients: form.ingredients.map((i) => i.trim()).filter(Boolean),
        fragrance_load: form.fragrance_load.trim(),
        batch_size: form.batch_size.trim(),
        label: form.label.trim(),
        wax: form.wax.trim(),
        wick: form.wick.trim(),
        pour_temp: pour || '',
        add_temp: add || '',
        depth: form.depth.trim(),
        notes: form.notes.trim(),
        seasonal_tags: form.seasonal_tags.map((t) => t.trim()).filter(Boolean).slice(0, MAX_SEASONAL_TAGS),
        pending_retest: false,
      };
      await onSave(draft, candle ? candle.id : null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!candle) return;
    if (!confirm('Delete this candle? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(candle.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h2>Candle {form.number || '(new)'}</h2>
        <div className="sub">
          {candle?.archived
            ? 'Archived / killed candle — historical reference only'
            : 'Edit and save this recipe card'}
        </div>

        <div className="field">
          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="row3">
          <div className="field">
            <label>Number</label>
            <input
              type="text"
              value={form.number}
              onChange={(e) => updateField('number', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Final stamp</label>
            <input
              type="text"
              value={form.final_stamp}
              onChange={(e) => updateField('final_stamp', e.target.value)}
            />
          </div>
          <div className="field"></div>
        </div>

        <div className="field">
          <label>Seasonal tags</label>
          <div>
            {form.seasonal_tags.map((tag, i) => (
              <div className="ing-row" key={i}>
                <input
                  type="text"
                  placeholder="e.g. Holiday"
                  value={tag}
                  onChange={(e) => updateSeasonalTag(i, e.target.value)}
                />
                <button
                  className="ing-remove"
                  type="button"
                  onClick={() => removeSeasonalTag(i)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          {form.seasonal_tags.length < MAX_SEASONAL_TAGS ? (
            <button
              className="btn ghost"
              type="button"
              style={{ marginTop: '4px' }}
              onClick={addSeasonalTag}
            >
              + Add tag
            </button>
          ) : (
            <div className="field-hint">Limit of {MAX_SEASONAL_TAGS} tags</div>
          )}
        </div>

        <div className="field">
          <label>Primary status</label>
          <select
            value={form.primary_status}
            onChange={(e) => updateField('primary_status', e.target.value)}
          >
            {PRIMARY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Secondary statuses</label>
          <select
            multiple
            size={SECONDARY_STATUSES.length}
            value={form.secondary_statuses}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (o) => o.value);
              updateField('secondary_statuses', values);
            }}
          >
            {SECONDARY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="field-hint">Hold ⌘/Ctrl (or Shift for a range) to select more than one.</div>
        </div>

        <div className="field">
          <label>Scent family</label>
          <input
            type="text"
            value={form.family}
            onChange={(e) => updateField('family', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Descended from (candle #)</label>
          <input
            type="text"
            placeholder="e.g. 27"
            value={form.derived_from}
            onChange={(e) => updateField('derived_from', e.target.value)}
          />
        </div>
        {children.length ? (
          <div className="field" style={{ marginTop: '-8px' }}>
            <label>Inspired by this candle</label>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
              {children.map((ch) => `#${ch.number} ${ch.name || ''}`).join(', ')}
            </div>
          </div>
        ) : null}

        <div className="field">
          <label>Ingredients</label>
          <div>
            {form.ingredients.map((ing, i) => (
              <div className="ing-row" key={i}>
                <input
                  type="text"
                  value={ing}
                  onChange={(e) => updateIngredient(i, e.target.value)}
                />
                <button className="ing-remove" type="button" onClick={() => removeIngredient(i)}>
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button className="btn ghost" type="button" style={{ marginTop: '4px' }} onClick={addIngredient}>
            + Add ingredient
          </button>
        </div>

        <div className="row3">
          <div className="field">
            <label>Fragrance load %</label>
            <input
              type="text"
              value={form.fragrance_load}
              onChange={(e) => updateField('fragrance_load', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Batch size</label>
            <input
              type="text"
              value={form.batch_size}
              onChange={(e) => updateField('batch_size', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Label color</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => updateField('label', e.target.value)}
            />
          </div>
        </div>

        <div className="row3">
          <div className="field">
            <label>Wax</label>
            <input
              type="text"
              value={form.wax}
              onChange={(e) => updateField('wax', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Wick</label>
            <input
              type="text"
              value={form.wick}
              onChange={(e) => updateField('wick', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Pour / add temp</label>
            <input
              type="text"
              value={form.tempCombined}
              onChange={(e) => updateField('tempCombined', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Depth &amp; complexity suggestion</label>
          <textarea value={form.depth} onChange={(e) => updateField('depth', e.target.value)} />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
        </div>

        <div className="modal-actions">
          {isNew ? (
            <div />
          ) : (
            <button className="btn danger" type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <div className="modal-actions-right">
            <button className="btn ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function blankDraft(): CandleDraft {
  return {
    number: '',
    name: '',
    primary_status: 'Pending Creation',
    secondary_statuses: [],
    final_stamp: '',
    family: '',
    depth: '',
    derived_from: '',
    label: '',
    ingredients: [],
    fragrance_load: '',
    batch_size: '2LBS',
    wax: 'Coconut Apricot',
    wick: 'LX-18',
    add_temp: '160',
    pour_temp: '190',
    notes: '',
    archived: false,
    pending_retest: false,
    color_override_hex: null,
    font_override_hex: null,
    launch_phase: null,
    seasonal_tags: [],
  };
}
