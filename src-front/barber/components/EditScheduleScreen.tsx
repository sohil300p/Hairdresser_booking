

import React, { useState } from 'react';
import { ArrowRight, Save, X } from 'lucide-react';
import MaterialInput from './MaterialInput';

interface Schedule {
    key: string;
    name: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

interface EditScheduleScreenProps {
    initialSchedule: Schedule[];
    onSave: (newSchedule: Schedule[]) => void;
    onBack: () => void;
}

const ToggleSwitch: React.FC<{ label: string, enabled: boolean, setEnabled: (e:boolean) => void, id: string}> = ({ label, enabled, setEnabled, id }) => (
    <div className="flex items-center gap-2">
        <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" id={id} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
        {label && <span className="text-sm font-medium text-gray-900">{label}</span>}
    </div>
);


const EditScheduleScreen: React.FC<EditScheduleScreenProps> = ({ initialSchedule, onSave, onBack }) => {
    const [editedSchedule, setEditedSchedule] = useState<Schedule[]>(JSON.parse(JSON.stringify(initialSchedule)));

    const handleDayToggle = (key: string) => {
        setEditedSchedule(editedSchedule.map(day => day.key === key ? {...day, isActive: !day.isActive} : day));
    };

    const handleTimeChange = (key: string, field: 'startTime' | 'endTime', value: string) => {
        setEditedSchedule(editedSchedule.map(day => day.key === key ? {...day, [field]: value} : day));
    };
    
    return (
        <div className="absolute inset-0 bg-surface-1 z-50 flex flex-col">
             <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-50 flex items-center gap-4 border-b border-gray-200">
                <button onClick={onBack} aria-label="بازگشت"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">ویرایش ساعات کاری</h1>
            </header>
            
            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                {editedSchedule.map(day => (
                    <div key={day.key} className={`p-4 rounded-lg transition ${day.isActive ? 'bg-white border shadow-xs' : 'bg-gray-100 opacity-70'}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-lg">{day.name}</span>
                            <ToggleSwitch label={day.isActive ? "فعال" : "تعطیل"} enabled={day.isActive} setEnabled={() => handleDayToggle(day.key)} id={`schedule-toggle-${day.key}`} />
                        </div>
                        {day.isActive && (
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                <MaterialInput id={`${day.key}-start`} label="ساعت شروع" type="time" value={day.startTime} onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)} />
                                <MaterialInput id={`${day.key}-end`} label="ساعت پایان" type="time" value={day.endTime} onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)} />
                            </div>
                        )}
                    </div>
                ))}
            </main>

            <footer className="p-4 border-t border-gray-200 flex gap-2" style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
                <button onClick={onBack} className="flex-1 h-12 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md font-semibold transition hover:bg-gray-300">
                    <X size={18} /> لغو
                </button>
                <button onClick={() => onSave(editedSchedule)} className="flex-1 h-12 flex items-center justify-center gap-1 bg-success-500 text-white px-3 py-1.5 rounded-md font-semibold transition hover:bg-success-600">
                    <Save size={18} /> ذخیره تغییرات
                </button>
            </footer>
        </div>
    );
};

export default EditScheduleScreen;
