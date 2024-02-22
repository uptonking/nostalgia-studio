import * as React from 'react';
import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { App } from './app';

const root = createRoot(document.getElementById('root')!);

const render = (element: React.ReactElement) => {
  root.render(<StrictMode>{element}</StrictMode>);
};

render(<App />);
