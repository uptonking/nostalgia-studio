/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';

import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import { CheckPermissions, NotFound } from '@strapi/helper-plugin';

import AlertDialog from '../../components/AlertDialog';
import pluginId from '../../pluginId';
import store from '../../state/store';
import HomePage from '../HomePage';

const App = () => {
  return (
    <CheckPermissions
      permissions={[{ action: 'plugin::csv-upload.read', subject: null }]}
    >
      <div>
        <Provider store={store}>
          <Helmet title={'CSV Upload'} />
          <Switch>
            <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
            <Route component={NotFound} />
          </Switch>
          <AlertDialog />
        </Provider>
      </div>
    </CheckPermissions>
  );
};

export default App;
