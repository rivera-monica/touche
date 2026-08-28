'use client';

import type { CSSProperties } from 'react';
import type { Candle } from '@/lib/types';
import { MAX_SEASONAL_TAGS } from '@/lib/types';
import {
  contrastText,
  findByNumber,
  getChildren,
  labelColorHex,
  PHASE_LABELS,
  secondaryClass,
  softText,
  statusClass,
} from '@/lib/candleHelpers';

export default function CandleCard({
  candle,
  allCandles,
  onOpen,
  onCyclePhase,
  onJump,
}: {
  candle: Candle;
  allCandles: Candle[];
  onOpen: (candle: Candle) => void;
  onCyclePhase: (candle: Candle) => void;
  onJump: (number: string) => void;
}) {
  const c = candle;
  const isKill = (c.primary_status || '').toLowerCase().includes('kill');
  const hasLabel = !!(c.label && c.label.trim());
  const hex = c.color_override_hex || labelColorHex(c.label);
  const ink = c.font_override_hex || contrastText(hex);
  const soft = c.font_override_hex || softText(hex);
  const phase = c.launch_phase || null;
  const swatchBorder = hasLabel ? ink : 'var(--ink-soft)';
  const parent = c.derived_from ? findByNumber(allCandles, c.derived_from) : null;
  const parentLabel = c.derived_from
    ? parent
      ? `#${parent.number} ${parent.name}`
      : `#${c.derived_from} (no card yet)`
    : '';
  const children = getChildren(allCandles, c.number);
  const lineageColor = hasLabel ? ink : 'var(--brass)';
  const hasIngredients = !!(c.ingredients && c.ingredients.length > 0);

  const className =
    'card' +
    (c.pending_retest ? ' pending' : '') +
    (isKill ? ' kill' : '') +
    (hasLabel ? '' : ' no-label');

  const cardStyle: CSSProperties = hasLabel
    ? {
        background: hex,
        borderColor: hex,
        color: ink,
        ['--card-ink' as string]: ink,
        ['--card-ink-soft' as string]: soft,
      }
    : {};

  return (
    <div className={className} style={cardStyle} onClick={() => onOpen(c)}>
      <div className="card-top">
        <div>
          <div className="card-num" style={{ color: hasLabel ? soft : 'var(--ink-soft)' }}>
            #{c.number}
          </div>
          <div className="card-name" style={{ color: hasLabel ? ink : 'var(--ink)' }}>
            {c.name || 'Unnamed'}
          </div>
        </div>
        <div
          className={'card-swatch' + (phase ? ' phase-' + phase.toLowerCase() : '')}
          style={!phase ? { borderColor: swatchBorder } : undefined}
          title={
            phase
              ? PHASE_LABELS[phase] + ' — click to advance'
              : 'N/A — click to mark: Phase 1 (throw & smell approved)'
          }
          onClick={(e) => {
            e.stopPropagation();
            onCyclePhase(c);
          }}
        >
          {phase || 'N/A'}
        </div>
      </div>

      <div className="badge-row">
        <span className={'badge ' + statusClass(c.primary_status)}>
          {c.primary_status || '—'}
        </span>
        {c.secondary_status ? (
          <span className={'badge secondary ' + secondaryClass(c.secondary_status)}>
            {c.secondary_status}
          </span>
        ) : null}
        {(c.seasonal_tags || []).slice(0, MAX_SEASONAL_TAGS).map((tag, i) => (
          <span className="badge seasonal" key={i + tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="card-family" style={{ color: hasLabel ? soft : 'var(--ink-soft)' }}>
        {(c.family || 'No scent family set').replace('PENDING RETEST — ', '')}
      </div>

      {c.pending_retest ? (
        <div className="card-flag" style={{ color: hasLabel ? ink : 'var(--danger)' }}>
          ⚑ Needs sniff-test confirmation
        </div>
      ) : null}

      {!hasIngredients ? (
        <div className="card-flag" style={{ color: hasLabel ? ink : 'var(--danger)' }}>
          ⚑ No recipe data
        </div>
      ) : null}

      {!hasLabel ? <div className="card-nolabel-flag">⚑ No label color set</div> : null}

      {children.length ? (
        <div className="card-lineage" style={{ color: lineageColor }}>
          → Inspired{' '}
          {children.map((ch, i) => (
            <span key={ch.id}>
              <span
                className="chip-link"
                onClick={(e) => {
                  e.stopPropagation();
                  onJump(ch.number);
                }}
              >
                #{ch.number} {ch.name || ''}
              </span>
              {i < children.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      ) : null}

      {c.derived_from ? (
        <div
          className="card-parent-badge"
          style={{ color: lineageColor, borderColor: lineageColor }}
          title={`Descended from ${parentLabel} — click to view`}
          onClick={(e) => {
            e.stopPropagation();
            onJump(c.derived_from);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 3 12 9 6"></polyline>
            <path d="M21 12H3"></path>
          </svg>
          Descendant · #{c.derived_from}
        </div>
      ) : null}
    </div>
  );
}
