import React, { Fragment, useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import {
  Accordion,
  AccordionContent,
  AccordionToggle,
  BaseHeaderLayout,
  Box,
  Divider,
  JSONInput,
  Link,
} from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';

import type { Trail } from '../types/trail';
import { buildPayload } from '../utils/build-payload';
import { getTrad } from '../utils/get-trad';
import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';
import { RenderField } from './render-field';

type VersionReviewProps = {
  trail: Trail;
  changedFields: string[];
  setShowReviewDiff: (...args: any[]) => any;
  layout: any;
};

export function VersionReview(props: VersionReviewProps) {
  const { trail, changedFields, setShowReviewDiff, layout } = props;
  const { content } = trail;

  const { formatMessage } = useIntl();

  const [expanded, setExpanded] = useState(false);
  const [changePayload, setChangePayload] = useState({});

  const { trail: trimmedContent } = useMemo(() => {
    return prepareTrailFromSchema(content, layout);
  }, [content, layout]);

  useEffect(() => {
    const changePayloadObj = buildPayload(trimmedContent, changedFields);
    setChangePayload(changePayloadObj);
  }, [trimmedContent, changedFields]);

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
                setShowReviewDiff(false);
              }}
            >
              {formatMessage({
                id: getTrad('plugin.admin.versionTrail.back'),
                defaultMessage: 'Back',
              })}
            </Link>
          }
          title={formatMessage({
            id: getTrad('plugin.admin.versionTrail.reviewChanges'),
            defaultMessage: 'Review changes',
          })}
          subtitle={formatMessage({
            id: getTrad('plugin.admin.versionTrail.reviewChangesDescription'),
            defaultMessage:
              "Review the below changes carefully. Upon clicking 'Restore' the record will be instantly updated with the selected values.",
          })}
          as='h3'
        />
      </Box>
      <Box paddingBottom={6} paddingTop={6}>
        <Divider />
      </Box>
      <Box padding={4} background='neutral100'>
        {Object.keys(changePayload).map((key) => (
          <RenderField
            key={key}
            name={key}
            value={changePayload[key]}
            hideAccordion={true}
            layout={layout}
          />
        ))}
      </Box>
      <Box padding={4} background='neutral100'>
        <Accordion
          expanded={expanded}
          onToggle={() => setExpanded((s) => !s)}
          id='acc-field-pt-raw'
        >
          <AccordionToggle
            togglePosition='right'
            title={formatMessage({
              id: getTrad('plugin.admin.versionTrail.viewRawJson'),
              defaultMessage: 'View JSON',
            })}
          />
          <AccordionContent>
            <Box padding={3}>
              <JSONInput value={JSON.stringify(changePayload, null, 2)} />
            </Box>
          </AccordionContent>
        </Accordion>
      </Box>
    </Fragment>
  );
}
