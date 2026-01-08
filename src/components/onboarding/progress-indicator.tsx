'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepConfig, OnboardingStep } from '@/lib/onboarding/types'

interface ProgressIndicatorProps {
  steps: StepConfig[]
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
}: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          const isPast = index < currentIndex

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                    isCompleted || isPast
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step title - visible on larger screens */}
                <span
                  className={cn(
                    'absolute -bottom-6 text-xs font-medium whitespace-nowrap hidden sm:block',
                    isCurrent
                      ? 'text-primary'
                      : isCompleted || isPast
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isPast || isCompleted
                        ? 'bg-primary'
                        : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile step title */}
      <div className="mt-4 text-center sm:hidden">
        <p className="text-sm font-medium text-primary">
          Step {currentIndex + 1}: {steps[currentIndex]?.title}
        </p>
      </div>
    </div>
  )
}
