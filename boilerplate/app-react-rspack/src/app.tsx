import './index.scss';

import * as React from 'react';

import { Button } from '@datalking/components';

import logo from './assets/images/react-logo.svg';
import { Card } from './components';

export const App = () => {
  return (
    <div>
      <input type='' />
      <h1>Hello, 世界 20240222 </h1>
      <Button />
      <img src={logo} className='AppLogo' alt='logo' />
      <Card size={16} />
    </div>
  );
};

export default App;
