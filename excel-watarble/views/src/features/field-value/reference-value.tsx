import React from 'react';

import { Badge, Group } from '@datalking/pivot-ui';

export const ReferenceValue: React.FC<{
  values?: (string | undefined | null)[];
}> = ({ values }) => {
  const visibleValues = values?.filter(Boolean) ?? [];

  return (
    <Group spacing='xs'>
      <Badge color='gray' size='xs' sx={{ textTransform: 'unset' }}>
        {visibleValues.toString() || <>Unnamed</>}
      </Badge>
    </Group>
  );
};
