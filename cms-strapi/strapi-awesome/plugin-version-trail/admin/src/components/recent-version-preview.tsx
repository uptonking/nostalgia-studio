import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { format, parseISO } from 'date-fns';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { Form, InputRenderer } from '@strapi/admin/strapi-admin';
import { Box, Typography } from '@strapi/design-system';

import { useTypedSelector } from '../hooks/use-selector-dispatch';
import type { Trail } from '../types/trail';
import { getFieldType } from '../utils/get-field-type';
import { getTrad } from '../utils/get-trad';
import { getUser } from '../utils/get-user';
import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';
import { BlocksRenderer } from './blocks-renderer';

type RecentVersionPreviewProps = {
  trails: Trail[];
  layout: any;
};

export const RecentVersionPreview = (props: RecentVersionPreviewProps) => {
  const { trails, layout } = props;

  const { formatMessage } = useIntl();

  const previewVerNumber = useTypedSelector(
    (state) => state['version-trail'].app.previewVersion.verNumber,
  );
  const trail =
    trails.find((t) => t.version === previewVerNumber) || ({} as Trail);
  const { content } = trail;

  const { trail: trimmedContent } = useMemo(() => {
    return prepareTrailFromSchema(content, layout);
  }, [content, layout]);

  // console.log(';; recent-fields ', trimmedContent, layout);

  if (!content) {
    return null;
  }

  return (
    <>
      <StyledRecentVersion
        aria-labelledby='preview-version'
        background='neutral0'
        borderWidth='2px'
        borderStyle='solid'
        borderColor='primary200'
        hasRadius
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={2}
        marginBottom={4}
        shadow='tableShadow'
      >
        <Typography as='h2' variant='epsilon'>
          <Typography as='span' textColor='primary600'>
            Selected Version: v{previewVerNumber} -{' '}
            {format(parseISO(trail.createdAt), 'yyyy-MM-dd HH:mm')}{' '}
          </Typography>
          <Typography as='span'>
            {formatMessage({
              id: getTrad('plugin.admin.versionTrail.by'),
              defaultMessage: 'by',
            })}{' '}
            {getUser(trail)}
          </Typography>{' '}
        </Typography>{' '}
        <Form disabled={true} initialValues={trimmedContent} method='PUT'>
          {Object.keys(trimmedContent).map((key) => {
            const fieldType = layout.attributes[key]['type'];

            if (fieldType === 'blocks') {
              return (
                <Box key={key}>
                  <Typography as='p'>{key}</Typography>
                  <Box
                    borderWidth='2px'
                    borderStyle='solid'
                    borderColor='primary100'
                    hasRadius
                    padding={2}
                    shadow='tableShadow'
                  >
                    <BlocksRenderer key={key} content={trimmedContent[key]} />
                  </Box>
                </Box>
              );
            }

            return (
              <InputRenderer
                key={key}
                name={key}
                label={key}
                type={getFieldType(fieldType)}
                // value={trimmedContent[key]}
              />
            );
          })}
        </Form>
      </StyledRecentVersion>
      <Typography as='h2' textColor='primary600' variant='epsilon'>
        Current Version
      </Typography>
    </>
  );
};

export const PortaledRecentVersion = ({ layout, trails }) => {
  const [rootElem, setRootElem] = useState<HTMLDivElement | undefined>();

  useEffect(() => {
    const portalRoot = document.createElement('div');
    setRootElem(portalRoot);
    portalRoot.className = 'mark-perview-ver';
    const portalRootParent = document.querySelector(
      'main > form div[role="tabpanel"]',
    );
    // console.log(';; portalRootParent ', portalRootParent)
    if (portalRootParent) {
      portalRootParent.prepend(portalRoot);
      return () => {
        portalRoot.remove();
      };
    }
  }, []);

  return rootElem
    ? createPortal(
        <RecentVersionPreview layout={layout} trails={trails} />,
        rootElem,
      )
    : null;
};

const StyledRecentVersion = styled(Box)`
  h2 {
    margin-top: 4px;
    margin-bottom: 20px;
  }
  h2 > span {
    font-size: 0.9rem;
  }
  form > div {
    margin-top: 4px;
    margin-bottom: 12px;
  }
`;
