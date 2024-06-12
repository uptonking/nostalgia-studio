import React, { createContext, useEffect, useMemo, useCallback, useState, useContext } from 'react'
import type { StepProgressContextProps, UseStepProgressOptions } from './types'

export const StepProgressContext = createContext<StepProgressContextProps>({} as StepProgressContextProps)

export const StepProgressProvider = ({ children }: { children: React.ReactNode }) => {
  const [isError, setIsError] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const stepsProgressVal = useMemo(
    () => ({
      isError,
      setIsError,
      currentStep,
      setCurrentStep,
    }),
    [currentStep, isError],
  )

  return <StepProgressContext.Provider value={stepsProgressVal}>{children}</StepProgressContext.Provider>
}

export const useStepProgress = ({ steps, startingStep }: UseStepProgressOptions) => {
  const context = useContext(StepProgressContext)
  console.log(";; ctx ", context)

  if (context === undefined) {
    throw new Error('useStepProgress must be used within a StepProgressProvider')
  }

  const { setCurrentStep, currentStep, setIsError, isError } = context

  const stepForward = useCallback(() => {
    if (currentStep === steps.length - 1) return

    // const stepValidator = steps[currentStep].validator
    const stepValidator = undefined as (() => boolean) | undefined

    if (typeof stepValidator === 'function' && !stepValidator()) {
      setIsError(true)
    } else {
      setCurrentStep((old) => old + 1)
      setIsError(false)
    }
  }, [currentStep, setCurrentStep, setIsError, steps.length])

  const stepBackwards = useCallback(() => {
    if (currentStep === 0) return
    setCurrentStep((old) => old - 1)
    setIsError(false)
  }, [currentStep, setCurrentStep, setIsError])

  const setStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
    },
    [setCurrentStep],
  )

  useEffect(() => {
    setCurrentStep(startingStep || 0)
  }, [setCurrentStep, startingStep])

  return {
    stepForward,
    stepBackwards,
    currentStep,
    setStep,
    isError
  }
}
