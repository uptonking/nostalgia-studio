import './index.scss';
import 'quill/styles/quill.snow.css';
import '@datalking/noseditor/src/styles.scss';

import * as React from 'react';

import { NoseditorFull } from '../src/noseditor-full';
import logo from './assets/images/react-logo.svg';

export const App = () => {
  return (
    <div>
      <h1>Hello, Noseditor 编辑器 202404 </h1>
      {/* <img src={logo} className='AppLogo' alt='logo' /> */}
      <NoseditorFull />
    </div>
  );
};

export default App;
