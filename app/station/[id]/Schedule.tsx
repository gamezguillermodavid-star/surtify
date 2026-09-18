'use client';

import { useState } from 'react';
import {
  DAY_LABELS,
  formatDayHours,
  getScheduleStatus,
  parseSchedule,
} from '@/lib/schedule';

export default function Schedule({ raw }: { raw: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const week = parseSchedule(raw);
  if (!week) return null;

  const status = getScheduleStatus(week);
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <div className="mx-4 mt-6">
      <h2 className="font-display text-sm uppercase text-muted">Horarios</h2>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="tap-target mt-2 flex w-full items-center justify-between rounded-2xl bg-surface2 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase ${
              status.isOpen ? 'bg-green/20 text-green' : 'bg-red/20 text-red'
            }`}
          >
            {status.isOpen ? 'Abierto' : 'Cerrado'}
          </span>
          <span className="text-sm text-ink">{status.label}</span>
        </div>
        <span className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface px-4">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`flex items-center justify-between py-2.5 text-sm ${
                i === todayIndex ? 'font-semibold text-ink' : 'text-muted'
              }`}
            >
              <span>{label}</span>
              <span>{formatDayHours(week[i])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
