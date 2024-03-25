import { extendCTBAttributeInitialDataMiddleware } from './extend-ctb-attr-initial-data';
import { extendCTBInitialDataMiddleware } from './extend-ctb-initial-data';

export const middlewares = [
  extendCTBInitialDataMiddleware,
  extendCTBAttributeInitialDataMiddleware,
];

export default middlewares;
