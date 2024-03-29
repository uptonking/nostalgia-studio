import { Route, Routes } from 'react-router-dom';

import { Page } from '@strapi/strapi/admin';

import { HomePage } from './HomePage';

export const App = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path='*' element={<Page.Error />} />
    </Routes>
  );
};

export default App;
