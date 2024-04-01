import React, { Fragment } from 'react';

import { format, parseISO } from 'date-fns';
import { useIntl } from 'react-intl';

import { BaseHeaderLayout, Box, Divider, Link } from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';

import type { Trail } from '../types/trail';
import { getTrad } from '../utils/get-trad';
import { getUser } from '../utils/get-user';
import { RevisionForm } from './revision-form';

type VersionRestoreViewProps = {
  setViewRevision: (...args: any[]) => any;
  setRevisedFields: (...args: any[]) => any;
  trail: Trail;
  layout: any;
};

export function VersionRestoreView(props: VersionRestoreViewProps) {
  const { trail, setViewRevision, setRevisedFields, layout } = props;

  const { formatMessage } = useIntl();

  return (
    <Fragment>
      <Box background='neutral100'>
        <BaseHeaderLayout
          navigationAction={
            <Link
              to='#back'
              startIcon={<ArrowLeft />}
              onClick={(event) => {
                event.preventDefault();
                setViewRevision(null);
              }}
            >
              {formatMessage({
                id: getTrad('plugin.admin.versionTrail.back'),
                defaultMessage: 'Back',
              })}
            </Link>
          }
          title={`${formatMessage({
            id: getTrad('plugin.admin.versionTrail.version'),
            defaultMessage: 'Version',
          })} ${trail.version}`}
          subtitle={`${formatMessage({
            id: getTrad('plugin.admin.versionTrail.id'),
            defaultMessage: 'ID',
          })}: ${trail.recordId} | ${trail.change} | ${format(
            parseISO(trail.createdAt),
            'MMM d, yyyy HH:mm',
          )} ${formatMessage({
            id: getTrad('plugin.admin.versionTrail.by'),
            defaultMessage: 'by',
          })} ${getUser(trail)}`}
          as='h3'
        />
      </Box>
      <Box paddingBottom={6} paddingTop={6}>
        <Divider />
      </Box>
      <Box
        background='neutral0'
        borderColor='neutral150'
        hasRadius
        paddingBottom={4}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={6}
      >
        <RevisionForm
          trail={trail}
          setRevisedFields={setRevisedFields}
          layout={layout}
        />
      </Box>
    </Fragment>
  );
}
