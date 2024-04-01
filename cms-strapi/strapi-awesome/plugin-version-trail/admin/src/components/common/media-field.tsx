import React from 'react';

import { useIntl } from 'react-intl';

import { Box, Grid, Typography } from '@strapi/design-system';

import { getTrad } from '../../utils/get-trad';
import { MediaCard } from './media-card';

type MediaFieldProps = {
  media: any;
  attributes: { multiple: boolean };
};

export function MediaField(props: MediaFieldProps) {
  const { media, attributes } = props;
  const { multiple } = attributes;

  const { formatMessage } = useIntl();

  if (!media || media.length === 0) {
    return (
      <Box paddingTop={2} paddingLeft={4}>
        <Typography variant='beta'>
          {formatMessage({
            id: getTrad('plugin.admin.versionTrail.empty'),
            defaultMessage: 'Empty',
          })}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid gap={5}>
      {multiple ? (
        media.map((item) => <MediaCard key={item.id} id={item.id} />)
      ) : (
        <MediaCard id={media} />
      )}
    </Grid>
  );
}
