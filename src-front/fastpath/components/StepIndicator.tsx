import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, labels }) => {
  return (
    <div className="w-full px-2 py-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 right-4 left-4 h-0.5 bg-gray-200 z-0" />
        {/* Active line */}
        <div
          className="absolute top-4 right-4 h-0.5 bg-[var(--md-sys-color-primary)] z-0 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--md-sys-color-primary)] text-white shadow-md'
                    : isCurrent
                      ? 'bg-white border-2 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] shadow-lg ring-4 ring-blue-100'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              {labels?.[i] && (
                <span
                  className={`text-[10px] mt-1.5 text-center leading-tight max-w-[56px] ${
                    isCompleted || isCurrent
                      ? 'text-[var(--md-sys-color-primary)] font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {labels[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
