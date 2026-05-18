'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Props {
  currentStep: number;
  steps: string[];
}

export default function OnboardingProgress({ currentStep, steps }: Props) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="relative flex flex-col items-center">
              <motion.div
                className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-white'
                    : isCurrent
                    ? 'border-2 border-primary bg-white text-primary'
                    : 'border-2 border-slate-200 bg-white text-slate-400'
                }`}
                initial={false}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <span
                className={`absolute -bottom-5 whitespace-nowrap text-[9px] font-medium hidden md:block ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-1 h-px w-6 md:w-10 overflow-hidden bg-slate-200 rounded-full">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
