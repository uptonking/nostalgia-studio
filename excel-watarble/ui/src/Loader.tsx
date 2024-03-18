import React from 'react';

import { css } from '@linaria/core';
import { Loader } from '@mantine/core';
import styled from '@emotion/styled';

export { Loader };

export const FullPageLoader = () => {
  return (
    <StyledD>
      <Loader />
    </StyledD>
  );
};

const StyledD = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 98vw;
  height: 98vh;
  /* width: 100%; */
  /* height: 100%; */
`;
