import { meaningOfLife } from '@datalking/foo';
import React from 'react';

export const Button = () => (
  <button
    type='button'
    onClick={() => alert(`the meaning of life is ${meaningOfLife}`)}
  >
    Click me {meaningOfLife}
  </button>
);
