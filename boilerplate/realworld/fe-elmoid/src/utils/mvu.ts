import { Consoling } from './effects';

export const LogError = (state, error) => [state, Consoling(error)];
