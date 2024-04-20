import * as React from 'react';
import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { App } from './app';

const root = createRoot(document.getElementById('root')!);

const renderREle = (element: React.ReactElement) => {
  root.render(<StrictMode>{element}</StrictMode>);
  // root.render(element);
};

renderREle(<App />);
