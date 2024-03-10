import type { SanitizedUserData } from './user-type';

declare module 'express' {
  export interface Request {
    user?: SanitizedUserData | null;
  }
}
