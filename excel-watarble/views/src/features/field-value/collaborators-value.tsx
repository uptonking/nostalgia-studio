import React from 'react';

import { Avatar, Center, Text } from '@datalking/pivot-ui';

interface IProps {
  values: (string | null)[];
}

export const CollaboratorsValue: React.FC<IProps> = ({ values }) => {
  const [username] = values;

  return (
    <Center>
      <Avatar size='xs'>{username?.slice(0, 2)}</Avatar>
      <Text ml='xs'>{username}</Text>
    </Center>
  );
};
