import React from 'react';
import { Icon } from '../../shared/components/Icon';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = React.useState(selectedDate.getFullYear());

  const daysOfWeek = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    // Adjust for Persian calendar (Saturday is 0)
    return day === 6 ? 0 : day + 1;
  };
  
  const handlePrevMonth = () => {
      if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(currentYear - 1);
      } else {
          setCurrentMonth(currentMonth - 1);
      }
  };
  
  const handleNextMonth = () => {
      if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(currentYear + 1);
      } else {
          setCurrentMonth(currentMonth + 1);
      }
  };
  
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('fa-IR-u-nu-latn', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full">
        <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><Icon name="chevronRight" /></button>
            <span className="font-bold text-[var(--text-primary)] font-mono">{monthName}</span>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><Icon name="chevronLeft" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm text-[var(--text-secondary)] mb-2">
            {daysOfWeek.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
            {days.map(day => {
                const date = new Date(currentYear, currentMonth, day);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = date < today;

                return (
                    <button 
                        key={day} 
                        onClick={() => onDateSelect(date)}
                        disabled={isPast}
                        className={`w-9 h-9 rounded-full transition-all flex items-center justify-center transform active:scale-95
                            ${isSelected ? 'bg-[var(--primary)] text-white font-bold' : 'text-[var(--text-primary)]'}
                            ${!isSelected && isToday ? 'bg-blue-100 text-[var(--primary)]' : ''}
                            ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent disabled:active:scale-100
                        `}
                    >
                        {day}
                    </button>
                )
            })}
        </div>
    </div>
  );
};