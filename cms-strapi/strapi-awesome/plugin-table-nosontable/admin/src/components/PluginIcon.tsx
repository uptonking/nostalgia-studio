import React from 'react';

import styled from 'styled-components';

import { Flex, Icon } from '@strapi/design-system';
import { Grid } from '@strapi/icons';

const IconBox = styled(Flex)`
  background-color: #f0f0ff; /* primary100 */
  border: 1px solid #d9d8ff; /* primary200 */

  svg > path {
    fill: #4945ff; /* primary600 */
  }
`;

export const NosontableIcon = () => {
  return (
    <IconBox
      justifyContent='center'
      alignItems='center'
      width={7}
      height={6}
      padding={1}
      hasRadius
      aria-hidden
    >
      <Icon as={Grid} />
    </IconBox>
  );
};
