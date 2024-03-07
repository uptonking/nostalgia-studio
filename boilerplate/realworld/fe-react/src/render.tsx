import React, { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { App } from './app';

const root = createRoot(document.getElementById('root')!);

const renderREle = (element: React.ReactElement) => {
  root.render(
    element,
    // <StrictMode>{element}</StrictMode>
  );
};

renderREle(<App />);
