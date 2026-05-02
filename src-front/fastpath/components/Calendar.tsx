import React from 'react';
import { Icon } from './Icon';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, minDate }) => {
  const daysOfWeek = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const minSelectableDate = React.useMemo(() => {
    const m = minDate ? new Date(minDate) : today;
    m.setHours(0, 0, 0, 0);
    return m.getTime() < today.getTime() ? today : m;
  }, [minDate, today]);

  const [viewDate, setViewDate] = React.useState<Date>(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const persianPartsDtf = React.useMemo(
    () =>
      new Intl.DateTimeFormat('fa-IR-u-nu-latn-u-ca-persian', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }),
    []
  );

  const persianMonthTitleDtf = React.useMemo(
    () =>
      new Intl.DateTimeFormat('fa-IR-u-nu-latn-u-ca-persian', {
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  function getPersianParts(d: Date): { year: number; month: number; day: number } {
    const parts = persianPartsDtf.formatToParts(d);
    const year = Number(parts.find((p) => p.type === 'year')?.value ?? 0);
    const month = Number(parts.find((p) => p.type === 'month')?.value ?? 0);
    const day = Number(parts.find((p) => p.type === 'day')?.value ?? 0);
    return { year, month, day };
  }

  function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function startOfPersianMonth(anyDate: Date): Date {
    const { day } = getPersianParts(anyDate);
    return addDays(anyDate, -(day - 1));
  }

  function getFirstDayOfGrid(d: Date): number {
    const day = d.getDay();
    // Saturday = 0
    return day === 6 ? 0 : day + 1;
  }

  // Keep viewDate in sync with selectedDate
  React.useEffect(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    setViewDate(d);
  }, [selectedDate]);

  // Ensure we never show a month strictly before minSelectableDate
  React.useEffect(() => {
    const viewStart = startOfPersianMonth(viewDate);
    const minStart = startOfPersianMonth(minSelectableDate);
    if (viewStart.getTime() < minStart.getTime()) {
      setViewDate(new Date(minSelectableDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minSelectableDate]);

  const monthStart = React.useMemo(() => startOfPersianMonth(viewDate), [viewDate]);
  const monthStartParts = React.useMemo(() => getPersianParts(monthStart), [monthStart]);
  const firstDay = React.useMemo(() => getFirstDayOfGrid(monthStart), [monthStart]);

  const monthDays = React.useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 40; i += 1) {
      const d = addDays(monthStart, i);
      const p = getPersianParts(d);
      if (p.year !== monthStartParts.year || p.month !== monthStartParts.month) break;
      out.push(d);
    }
    return out;
  }, [monthStart, monthStartParts.month, monthStartParts.year]);

  const monthTitle = React.useMemo(() => {
    const mid = monthDays[Math.min(monthDays.length - 1, Math.max(0, Math.floor(monthDays.length / 2)))] ?? monthStart;
    return persianMonthTitleDtf.format(mid);
  }, [monthDays, monthStart, persianMonthTitleDtf]);

  const isPrevDisabled = React.useMemo(() => {
    const prevMonthDate = addDays(monthStart, -1);
    const prevStart = startOfPersianMonth(prevMonthDate);
    const minStart = startOfPersianMonth(minSelectableDate);
    return prevStart.getTime() < minStart.getTime();
  }, [monthStart, minSelectableDate]);

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    setViewDate(addDays(monthStart, -1));
  };

  const handleNextMonth = () => {
    const lastDay = monthDays[monthDays.length - 1] ?? monthStart;
    setViewDate(addDays(lastDay, 1));
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="ماه قبل"
        >
          <Icon name="chevronRight" />
        </button>
        <span className="font-bold text-[var(--text-primary)] font-mono">{monthTitle}</span>
        <button type="button" onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="ماه بعد">
          <Icon name="chevronLeft" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm text-[var(--text-secondary)] mb-2">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 justify-items-center">
        {Array(firstDay).fill(null).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {monthDays.map((date) => {
          const { day } = getPersianParts(date);
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date.getTime() < minSelectableDate.getTime();

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => {
                if (isPast) return;
                onDateSelect(date);
              }}
              disabled={isPast}
              className={`w-9 h-9 rounded-full transition-all flex items-center justify-center transform active:scale-95
                ${isSelected ? 'bg-[var(--md-sys-color-primary)] text-white font-bold shadow-sm ring-2 ring-[var(--md-sys-color-primary)] ring-offset-2 ring-offset-white' : 'text-[var(--text-primary)]'}
                ${!isSelected && isToday ? 'ring-2 ring-blue-200 text-[var(--md-sys-color-primary)] font-semibold' : ''}
                ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent disabled:active:scale-100
              `}
              aria-disabled={isPast}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};