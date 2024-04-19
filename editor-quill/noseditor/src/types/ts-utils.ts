export type PartialPick<T, F extends keyof T> = Omit<T, F> &
  Partial<Pick<T, F>>;

/** make some properties required */
export type RequiredPick<T, F extends keyof T> = Omit<T, F> &
  Required<Pick<T, F>>;
