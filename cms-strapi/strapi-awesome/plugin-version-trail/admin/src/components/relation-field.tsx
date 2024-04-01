import React, { Fragment } from 'react';

import { useIntl } from 'react-intl';

import { Box, Typography } from '@strapi/design-system';

import { getTrad } from '../utils/get-trad';

type RelationFieldProps = {
  relation: {
    connect: Array<{ id: number }>;
    disconnect: Array<{ id: number }>;
  };

  attributes: { target: string };
};

export function RelationField(props: RelationFieldProps) {
  const { relation, attributes } = props;

  const { connect, disconnect } = relation;

  const { target } = attributes;

  const { formatMessage } = useIntl();

  return (
    <Fragment>
      <Box paddingLeft={3}>
        <Typography variant='beta'>
          {formatMessage({
            id: getTrad('plugin.admin.versionTrail.connect'),
            defaultMessage: 'Connect',
          })}
        </Typography>
        {connect && connect.length > 0 ? (
          <ul>
            {connect.map((item) => (
              <li key={item.id}>
                <Typography variant='omega'>
                  {target}: {item.id}
                </Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Box paddingTop={2}>
            <Typography variant='omega'>
              {formatMessage({
                id: getTrad('plugin.admin.versionTrail.empty'),
                defaultMessage: 'Empty',
              })}
            </Typography>
          </Box>
        )}
      </Box>
      <Box paddingLeft={3} paddingTop={2}>
        <Typography variant='beta'>
          {formatMessage({
            id: getTrad('plugin.admin.versionTrail.disconnect'),
            defaultMessage: 'Disconnect',
          })}
        </Typography>
        {disconnect && disconnect.length > 0 ? (
          <ul>
            {disconnect.map((item) => (
              <li key={item.id}>
                <Typography variant='omega'>
                  {target}: {item.id}
                </Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Box paddingTop={2}>
            <Typography variant='omega'>
              {formatMessage({
                id: getTrad('plugin.admin.versionTrail.empty'),
                defaultMessage: 'Empty',
              })}
            </Typography>
          </Box>
        )}
      </Box>
    </Fragment>
  );
}
