import { formatShortDate } from '@/utils/Money';

const formatTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

/** Human-readable "Mar 5, 2026 · 9:00 AM – 10:00 AM" for a booking slot. */
export const formatSlot = (startTime?: string, endTime?: string): string =>
  `${formatShortDate(startTime)} · ${formatTime(startTime)} – ${formatTime(endTime)}`;