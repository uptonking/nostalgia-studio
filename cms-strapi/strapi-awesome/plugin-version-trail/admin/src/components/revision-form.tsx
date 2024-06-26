import React, { Fragment, useState } from 'react';

import { useIntl } from 'react-intl';

import {
  Accordion,
  AccordionContent,
  AccordionToggle,
  Box,
  JSONInput,
  Typography,
} from '@strapi/design-system';

import type { Trail } from '../types/trail';
import { getTrad } from '../utils/get-trad';
import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';
import { RenderField } from './render-field';

type RevisionFormProps = {
  setRevisedFields: (...args: any[]) => any;
  trail: Trail;
  layout: any;
};

export function RevisionForm(props: RevisionFormProps) {
  const { trail, setRevisedFields, layout } = props;
  const { content } = trail;

  const { formatMessage } = useIntl();

  const [expanded, setExpanded] = useState(false);

  // * trim ignored props and anything not in the current schema
  const { trail: trimmedContent } = prepareTrailFromSchema(content, layout);

  return (
    <Fragment>
      <form>
        {Object.keys(trimmedContent).map((key) => (
          <RenderField
            key={key}
            name={key}
            value={trimmedContent[key]}
            setRevisedFields={setRevisedFields}
            layout={layout}
          />
        ))}
      </form>
      {/* raw json */}
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
              defaultMessage: 'View the version content in JSON ',
            })}
          />
          <AccordionContent>
            <Box padding={3}>
              <JSONInput value={JSON.stringify(trimmedContent, null, 2)} />
            </Box>
          </AccordionContent>
        </Accordion>
      </Box>
    </Fragment>
  );
}
