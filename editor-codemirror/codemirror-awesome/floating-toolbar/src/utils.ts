import type { EditorView } from '@codemirror/view';
import { setShowFloatingToolbar } from './toolbar-actions';

export function hideToolbar(view: EditorView) {
  view.dispatch({
    effects: setShowFloatingToolbar.of(false),
  });
}

function getOS() {
  // ref: https://dev.to/vvo/how-to-solve-window-is-not-defined-errors-in-react-and-next-js-5f97
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent
    if (/windows phone/i.test(userAgent)) {
      return 'Windows Phone'
    } else if (/android/i.test(userAgent)) {
      return 'Android'
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'iOS'
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(userAgent)) {
      return 'macOS'
    } else if (/Windows|Win16|Win32|WinCE|Win64/i.test(userAgent)) {
      return 'Windows'
    } else if (/Linux/i.test(userAgent)) {
      return 'Linux'
    } else {
      return 'Unknown OS'
    }
  }
  return 'Unknown OS'
}

export function os() {
  return getOS()
}

export function isAppleOs() {
  return ['macOS', 'iOS'].includes(os())
}
