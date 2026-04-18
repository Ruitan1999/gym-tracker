import { useState, useMemo } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(s: string): string {
  const d = parseDate(s);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (toDateString(today) === s) return 'Today';
  if (toDateString(yesterday) === s) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const today = useMemo(() => toDateString(new Date()), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateString(d);
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; dateStr: string; inMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const month = viewMonth === 0 ? 12 : viewMonth;
      const year = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr, inMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr, inMonth: true });
    }

    // Next month padding
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const month = viewMonth === 11 ? 1 : viewMonth + 2;
        const year = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, dateStr, inMonth: false });
      }
    }

    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function selectDate(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  function handleQuickSelect(dateStr: string) {
    const d = parseDate(dateStr);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onChange(dateStr);
    setOpen(false);
  }

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-end justify-between press text-left"
      >
        <span
          className="font-display leading-none"
          style={{
            fontSize: '2.75rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            fontVariationSettings: '"wdth" 85',
            color: 'var(--color-text)',
          }}
        >
          {formatDisplay(value)}
        </span>
        <span
          className="font-mono caps-tight text-[10px] pb-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {parseDate(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
          <span style={{ color: 'var(--color-text)' }} className="ml-1">↓</span>
        </span>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="relative z-50">
            <div
              className="absolute left-0 right-0 mt-3 p-4 card-elev"
              style={{ boxShadow: '0 24px 40px rgba(0,0,0,0.5)' }}
            >
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(today)}
                  className="flex-1 h-10 caps-tight text-[10px] press"
                  style={{
                    background: value === today ? 'var(--color-volt)' : 'transparent',
                    color: value === today ? '#ffffff' : 'var(--color-text)',
                    border: `1px solid ${value === today ? 'var(--color-volt)' : 'var(--color-line-2)'}`,
                    borderRadius: '2px',
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(yesterday)}
                  className="flex-1 h-10 caps-tight text-[10px] press"
                  style={{
                    background: value === yesterday ? 'var(--color-volt)' : 'transparent',
                    color: value === yesterday ? '#ffffff' : 'var(--color-text)',
                    border: `1px solid ${value === yesterday ? 'var(--color-volt)' : 'var(--color-line-2)'}`,
                    borderRadius: '2px',
                  }}
                >
                  Yesterday
                </button>
              </div>

              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-9 h-9 flex items-center justify-center press"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="Previous month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-4 h-4">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <span
                  className="caps-tight text-[11px]"
                  style={{ color: 'var(--color-text)' }}
                >
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-9 h-9 flex items-center justify-center press"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="Next month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-4 h-4">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center caps-tight text-[9px] py-1"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {d.slice(0, 1)}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px" style={{ background: 'var(--color-line)' }}>
                {calendarDays.map((cell) => {
                  const isSelected = cell.dateStr === value;
                  const isToday = cell.dateStr === today;
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => selectDate(cell.dateStr)}
                      className="h-10 font-mono text-[13px] flex items-center justify-center press"
                      style={{
                        background: isSelected ? 'var(--color-volt)' : 'var(--color-elev)',
                        color: isSelected
                          ? '#ffffff'
                          : !cell.inMonth
                          ? 'var(--color-text-faint)'
                          : 'var(--color-text)',
                        fontWeight: isSelected || isToday ? 600 : 400,
                        fontVariantNumeric: 'tabular-nums',
                        border: isToday && !isSelected ? '1px solid var(--color-volt)' : undefined,
                      }}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
