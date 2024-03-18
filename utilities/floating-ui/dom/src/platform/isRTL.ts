import { getComputedStyle } from '@floating-ui/utils/src/dom';

export function isRTL(element: Element) {
  return getComputedStyle(element).direction === 'rtl';
}
