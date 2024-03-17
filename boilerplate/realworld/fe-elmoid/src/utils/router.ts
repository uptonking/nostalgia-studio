import { fromEntries } from './object';
import page from './pagejs';

/** register routes as effect */
const router = (dispatch, { routes }) => {
  const normalizedRoutes = normalize(routes);
  Object.keys(normalizedRoutes).forEach((path) => {
    const route = normalizedRoutes[path];
    page(path, (context) => {
      dispatch(route, context.params);
    });
  });

  page.start();

  return () => {
    page.stop();
  };
};

const normalize = (routes) =>
  fromEntries(routes.map(([path, pageAction]) => [path, pageAction(path)]));

export const RoutePages = ({ routes }) => [router, { routes }];

const redirectEffect = (dispatch, props) => page.redirect(props.path);
export const Redirect = (props) => [redirectEffect, props];
export const RedirectAction = (path) => (state) => [state, Redirect({ path })];
