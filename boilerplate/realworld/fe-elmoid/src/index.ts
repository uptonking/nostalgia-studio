import { start } from './app';

const qs = document.querySelector.bind(document);

start(qs('#root') || qs('body'));
