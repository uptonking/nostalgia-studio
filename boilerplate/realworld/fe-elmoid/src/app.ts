import { app } from '@datalking/elmoid';

import { ReadUser } from './pages/common/user';
import { appView } from './pages/layout';
import { pathsToEffects } from './pages/routes';
import { RoutePages } from './utils/router';

const initialState = { user: {} };

export const start = (rootElem: Element) => {
  app({
    // @ts-expect-error fix-types
    init: () => [
      initialState,
      ReadUser,
      RoutePages({ routes: pathsToEffects }),
    ],
    view: appView,
    node: rootElem,
  });
};

window['app'] = app;
