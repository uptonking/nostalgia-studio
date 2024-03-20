import React from 'react';

import upperFirst from 'lodash/upperFirst';

import { Button } from '@strapi/design-system/Button';
import { HeaderLayout } from '@strapi/design-system/Layout';
import { Stack } from '@strapi/design-system/Stack';
import Plus from '@strapi/icons/Plus';

export function CustomAPICount({ count, setShowCustomAPICustomizationPage }) {
  return (
    <HeaderLayout
      id='title'
      primaryAction={
        <Stack horizontal spacing={2}>
          <Button
            startIcon={<Plus />}
            onClick={() => setShowCustomAPICustomizationPage(true)}
            type='submit'
            disabled={false}
          >
            Create new custom API
          </Button>
        </Stack>
      }
      title={upperFirst(`custom  API${count > 1 ? 's' : ''}`)}
      subtitle={`${count} ${count > 1 ? 'entries' : 'entry'} found`}
    />
  );
}
