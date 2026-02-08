import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import BottomSheet from './BottomSheet';

const STEP_MINUTES = 30;
const HOURS = 24;
const MINUTES = 60;

function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < HOURS; h++) {
    for (let m = 0; m < MINUTES; m += STEP_MINUTES) {
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function timeBefore(a: string, b: string): boolean {
  return a < b;
}

/** First time option strictly after start (for end picker); null if start is last slot */
function firstEndAfter(start: string): string | null {
  const idx = TIME_OPTIONS.findIndex((t) => t > start);
  return idx >= 0 ? TIME_OPTIONS[idx] : null;
}

function formatDisplay(t: string): string {
  const [h, m] = t.split(':').map(Number);
  if (h === 0 && m === 0) return '۱۲:۰۰ شب';
  if (h < 12) return `${h}:${String(m).padStart(2, '0')} صبح`;
  if (h === 12) return `۱۲:${String(m).padStart(2, '0')} ظهر`;
  return `${h - 12}:${String(m).padStart(2, '0')} عصر`;
}

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
  labelStart?: string;
  labelEnd?: string;
  disabled?: boolean;
  id?: string;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onChange,
  labelStart = 'ساعت شروع',
  labelEnd = 'ساعت پایان',
  disabled = false,
  id = 'time-range',
}: TimeRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(startTime);
  const [localEnd, setLocalEnd] = useState(endTime);
  const startScrollRef = useRef<HTMLDivElement>(null);
  const endScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalStart(startTime);
    const nextEnd = firstEndAfter(startTime);
    const endValid = endTime && timeBefore(startTime, endTime) ? endTime : (nextEnd ?? startTime);
    setLocalEnd(endValid);
  }, [startTime, endTime]);

  useEffect(() => {
    if (!open) return;
    const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, value: string) => {
      const el = ref.current;
      if (!el) return;
      const item = el.querySelector(`[data-value="${value}"]`);
      if (item) item.scrollIntoView({ block: 'center', behavior: 'auto' });
    };
    const t = requestAnimationFrame(() => {
      scrollTo(startScrollRef, localStart);
      scrollTo(endScrollRef, localEnd);
    });
    return () => cancelAnimationFrame(t);
  }, [open, localStart, localEnd]);

  const canConfirm = timeBefore(localStart, localEnd);
  const handleConfirm = () => {
    if (!canConfirm) return;
    onChange(localStart, localEnd);
    setOpen(false);
  };

  const pickerHeight = 200;
  const endTimeOptions = TIME_OPTIONS.filter((t) => timeBefore(localStart, t));

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="w-full flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-right transition hover:border-primary-400 hover:bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:pointer-events-none"
        aria-label={`${labelStart} تا ${labelEnd}`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <Clock size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-xs text-gray-500">{labelStart} – {labelEnd}</span>
          <span className="block text-base font-semibold text-gray-900 truncate">
            {formatDisplay(startTime)} تا {formatDisplay(endTime)}
          </span>
        </div>
        <span className="text-gray-400 text-sm">تغییر</span>
      </button>

      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="انتخاب بازه ساعت"
      >
        <div className="flex flex-col gap-6 pb-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-2">{labelStart}</p>
              <div
                ref={startScrollRef}
                className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                style={{ height: pickerHeight }}
              >
                <div className="overflow-y-auto h-full scroll-smooth py-2" style={{ scrollSnapType: 'y mandatory' }}>
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-value={t}
                      onClick={() => {
                        setLocalStart(t);
                        if (!timeBefore(t, localEnd)) setLocalEnd(firstEndAfter(t) ?? t);
                      }}
                      className={`w-full py-2.5 px-3 text-center text-base transition scroll-snap-align-center ${
                        localStart === t
                          ? 'bg-primary-600 text-white font-semibold'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatDisplay(t)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-2">{labelEnd}</p>
              <div
                ref={endScrollRef}
                className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                style={{ height: pickerHeight }}
              >
                <div className="overflow-y-auto h-full scroll-smooth py-2" style={{ scrollSnapType: 'y mandatory' }}>
                  {endTimeOptions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-value={t}
                      onClick={() => setLocalEnd(t)}
                      className={`w-full py-2.5 px-3 text-center text-base transition scroll-snap-align-center ${
                        localEnd === t
                          ? 'bg-primary-600 text-white font-semibold'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatDisplay(t)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full h-12 rounded-xl bg-primary-600 text-white font-bold text-base hover:bg-primary-700 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            تایید
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

export default TimeRangePicker;
