import React, { useEffect, useState } from 'react';

import { useIntl } from 'react-intl';

import {
  Box,
  Card,
  CardAsset,
  CardBadge,
  CardBody,
  CardContent,
  CardHeader,
  CardSubtitle,
  CardTitle,
  GridItem,
  Loader,
  Typography,
} from '@strapi/design-system';
import { Picture } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';

import { getTrad } from '../../utils/get-trad';

type MediaCardProps = {
  id: number;
};

export function MediaCard(props: MediaCardProps) {
  const { id } = props;

  const { formatMessage } = useIntl();
  const request = useFetchClient();

  const [media, setMedia] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Record<string, unknown> | boolean>(false);

  useEffect(() => {
    async function fetchData() {
      const reqFilesUrl = `/upload/files?page=1&pageSize=1&filters[$and][0][id]=${id}`;

      try {
        const result = await request.get(reqFilesUrl);

        const { data = {} } = result;

        const { results = [] } = data;

        if (results.length > 0) {
          setMedia(results[0]);
          setLoaded(true);
        } else {
          setError(
            formatMessage({
              id: getTrad('plugin.admin.versionTrail.mediaNotFound'),
              defaultMessage: 'Empty',
            }) as unknown as Record<string, unknown>,
          );
        }
      } catch (Err) {
        console.warn('version-trail: ', Err);
        setError(Err as Record<string, unknown>);
      }
    }

    fetchData();
  }, [id, formatMessage, request]);

  return (
    <GridItem col={4}>
      {error ? (
        <Box
          background='neutral0'
          borderColor='neutral150'
          hasRadius
          paddingBottom={4}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={6}
          shadow='tableShadow'
        >
          <Typography variant='beta'>{String(error)}</Typography>
        </Box>
      ) : null}
      {!error && loaded && media ? (
        <Card
          style={{
            width: '100%',
          }}
        >
          <CardHeader>
            <CardAsset
              src={
                // @ts-expect-error fix-types
                media?.mime?.includes('image')
                  ? // @ts-expect-error fix-types
                    media?.formats?.thumbnail?.url || media.url
                  : null
              }
            >
              {
                // @ts-expect-error fix-types
                !media?.mime?.includes('image') ? <Picture /> : null
              }
            </CardAsset>
          </CardHeader>
          <CardBody>
            <CardContent>
              <CardTitle>{String(media?.name)}</CardTitle>
              <CardSubtitle>{String(media?.mime)}</CardSubtitle>
            </CardContent>
            <CardBadge>
              {formatMessage({
                id: getTrad('plugin.admin.versionTrail.media'),
                defaultMessage: 'Media',
              })}
            </CardBadge>
          </CardBody>
        </Card>
      ) : (
        <Box
          background='neutral0'
          borderColor='neutral150'
          hasRadius
          paddingBottom={4}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={6}
          shadow='tableShadow'
        >
          <Loader />
        </Box>
      )}
    </GridItem>
  );
}
