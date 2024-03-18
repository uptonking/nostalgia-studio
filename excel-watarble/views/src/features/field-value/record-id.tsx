import React from 'react';

import { Badge } from '@datalking/pivot-ui';

export const RecordId: React.FC<{ id: string }> = ({ id }) => {
  return (
    <Badge color='gray.6' radius='xl' sx={{ textTransform: 'unset' }}>
      {id}
    </Badge>
  );
};
