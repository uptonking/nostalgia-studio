import type React from 'react'

declare enum StepStates {
  NOT_STARTED = 'not_started',
  CURRENT = 'current',
  ERROR = 'error',
  COMPLETED = 'completed',
}

export interface ProgressStep {
  label: string
  state?: StepStates
}

export interface StepProgressContextProps {
  steps?: ProgressStep[]
  currentStep: number
  isError: boolean
  setIsError: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

export interface UseStepProgressOptions {
  steps: ProgressStep[]
  startingStep?: number
}

export interface UseStepProgressReturn {
  stepForward(): void
  stepBackwards(): void
  setStep(step: number): void
  currentIndex: number
  getProps: StepProgressProps
}

export interface StepProgressProps {
  steps: ProgressStep[]
  currentStep: number
  isError: boolean
  startingStep?: number
  wrapperClass?: string
  progressClass?: string
  stepClass?: string
}

export interface StepProgressBarProps {
  className?: string
  progressClass?: string
  stepClass?: string
  steps: ProgressStep[]
}

export interface StepProps {
  step: number
}

export interface ReducerAction {
  type: string
  payload: { index: number; state: StepStates; steps?: ProgressStep[] }
}
