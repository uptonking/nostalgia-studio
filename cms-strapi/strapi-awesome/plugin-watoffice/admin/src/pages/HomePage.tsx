import { Main } from '@strapi/design-system';

import pluginPkg from '../../../package.json';

const HomePage = () => {
  return (
    <Main>
      {/* <h1>Welcome to {formatMessage({ id: getTranslation('plugin.name') })}</h1> */}
      <h1>
        Welcome to {pluginPkg?.strapi?.displayName || pluginPkg.strapi.name}
      </h1>
      <button>I am a watoffice plugin.</button>
    </Main>
  );
};

export { HomePage };
