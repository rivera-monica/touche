'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Candle } from '@/lib/types';
import {
  familyOptions,
  findByNumber,
  matchesFilters,
  nextPhase,
  secondaryStatusOptions,
  statusOptions,
} from '@/lib/candleHelpers';
import CandleCard from './CandleCard';
import CandleModal from './CandleModal';
import ChipRow from './ChipRow';
import { signOut } from '@/app/login/actions';

type ModalState = { mode: 'new' } | { mode: 'edit'; candle: Candle } | null;

export default function Dashboard({
  initialCandles,
  userEmail,
}: {
  initialCandles: Candle[];
  userEmail: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [candles, setCandles] = useState<Candle[]>(sortBySortOrder(initialCandles));
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [secondaryFilters, setSecondaryFilters] = useState<Set<string>>(new Set());
  const [familyFilter, setFamilyFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  });
  const [resetting, setResetting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 1400);
  }, []);

  // Realtime: keep every open dashboard in sync when a teammate edits.
  useEffect(() => {
    const channel = supabase
      .channel('candles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candles' },
        (payload) => {
          setCandles((prev) => {
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as { id?: string }).id;
              return prev.filter((c) => c.id !== oldId);
            }
            const row = payload.new as Candle;
            const exists = prev.some((c) => c.id === row.id);
            const next = exists
              ? prev.map((c) => (c.id === row.id ? row : c))
              : [...prev, row];
            return sortBySortOrder(next);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filtered = useMemo(
    () =>
      candles.filter((c) =>
        matchesFilters(c, { statusFilters, secondaryFilters, familyFilter, searchTerm })
      ),
    [candles, statusFilters, secondaryFilters, familyFilter, searchTerm]
  );

  const total = candles.length;
  const active = candles.filter(
    (d) => !d.archived && !(d.primary_status || '').toLowerCase().includes('kill')
  ).length;
  const killed = candles.filter((d) => (d.primary_status || '').toLowerCase().includes('kill')).length;

  function toggleFilter(set: Set<string>, setter: (s: Set<string>) => void, option: string) {
    if (option === 'All') {
      setter(new Set());
      return;
    }
    const next = new Set(set);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    setter(next);
  }

  function openEdit(candle: Candle) {
    setModal({ mode: 'edit', candle });
  }

  function openNew() {
    setModal({ mode: 'new' });
  }

  function closeModal() {
    setModal(null);
  }

  function jumpTo(number: string) {
    const found = findByNumber(candles, number);
    if (!found) {
      showToast(`No card yet for #${number}`);
      return;
    }
    setModal({ mode: 'edit', candle: found });
  }

  async function cyclePhase(candle: Candle) {
    const phase = nextPhase(candle.launch_phase);
    setCandles((prev) =>
      prev.map((c) => (c.id === candle.id ? { ...c, launch_phase: phase } : c))
    );
    const { error } = await supabase
      .from('candles')
      .update({ launch_phase: phase })
      .eq('id', candle.id);
    if (error) {
      showToast('Could not save phase — check your connection');
      return;
    }
    showToast(phase ? phase : 'Phase cleared');
  }

  async function handleSave(draft: Partial<Candle>, id: string | null) {
    if (id) {
      const { data, error } = await supabase
        .from('candles')
        .update(draft)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        showToast('Save failed — check your connection');
        throw error;
      }
      setCandles((prev) => sortBySortOrder(prev.map((c) => (c.id === id ? data : c))));
    } else {
      const nextSortOrder = candles.reduce((max, c) => Math.max(max, c.sort_order), -1) + 1;
      const { data, error } = await supabase
        .from('candles')
        .insert({ ...draft, sort_order: nextSortOrder } as Candle)
        .select()
        .single();
      if (error) {
        showToast('Save failed — check your connection');
        throw error;
      }
      setCandles((prev) => sortBySortOrder([...prev, data]));
    }
    closeModal();
    showToast('Touché');
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('candles').delete().eq('id', id);
    if (error) {
      showToast('Delete failed — check your connection');
      throw error;
    }
    setCandles((prev) => prev.filter((c) => c.id !== id));
    closeModal();
    showToast('Deleted');
  }

  async function handleReset() {
    if (
      !confirm(
        'Reset all data back to the original import? Any edits your team made will be lost for everyone.'
      )
    )
      return;
    setResetting(true);
    try {
      const res = await fetch('/touche-seed-data.json');
      const seedRows = await res.json();
      const { error: deleteError } = await supabase.from('candles').delete().not('id', 'is', null);
      if (deleteError) throw deleteError;
      const { data, error: insertError } = await supabase.from('candles').insert(seedRows).select();
      if (insertError) throw insertError;
      setCandles(sortBySortOrder(data || []));
      showToast('Reset');
    } catch {
      showToast('Reset failed — check your connection');
    } finally {
      setResetting(false);
    }
  }

  const editingCandle = modal?.mode === 'edit' ? modal.candle : null;

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <h1>Touché</h1>
          <p>Master recipe dashboard</p>
        </div>
        <div className="header-right">
          <div className="stats">
            <div className="stat">
              <div className="n">{total}</div>
              <div className="l">Total</div>
            </div>
            <div className="stat">
              <div className="n">{active}</div>
              <div className="l">Active</div>
            </div>
            <div className="stat">
              <div className="n">{killed}</div>
              <div className="l">Killed</div>
            </div>
          </div>
          <div className="header-user">
            <span>{userEmail}</span>
            <form action={signOut}>
              <button className="signout-btn" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="rule"></div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by name, number, or ingredient…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)}>
          <option value="">All scent families</option>
          {familyOptions(candles).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={openNew}>
          + New candle
        </button>
        <button className="btn ghost" onClick={handleReset} disabled={resetting}>
          {resetting ? 'Resetting…' : 'Reset data'}
        </button>
      </div>

      <ChipRow
        options={statusOptions(candles)}
        active={statusFilters}
        onToggle={(o) => toggleFilter(statusFilters, setStatusFilters, o)}
      />
      <ChipRow
        options={secondaryStatusOptions(candles)}
        active={secondaryFilters}
        onToggle={(o) => toggleFilter(secondaryFilters, setSecondaryFilters, o)}
      />

      {filtered.length === 0 ? (
        <div className="empty">No candles match these filters.</div>
      ) : (
        <div className="grid">
          {filtered.map((c) => (
            <CandleCard
              key={c.id}
              candle={c}
              allCandles={candles}
              onOpen={openEdit}
              onCyclePhase={cyclePhase}
              onJump={jumpTo}
            />
          ))}
        </div>
      )}

      {modal ? (
        <CandleModal
          candle={editingCandle}
          allCandles={candles}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      ) : null}

      <div className={'toast' + (toast.show ? ' show' : '')}>{toast.message || 'Touché'}</div>
    </div>
  );
}

function sortBySortOrder(list: Candle[]): Candle[] {
  return [...list].sort((a, b) => a.sort_order - b.sort_order);
}
