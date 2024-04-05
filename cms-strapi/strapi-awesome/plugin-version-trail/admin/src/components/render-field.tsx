import React, { Fragment, useMemo, useState } from 'react';

import { useIntl } from 'react-intl';

import {
  Accordion,
  AccordionContent,
  AccordionToggle,
  BaseCheckbox,
  Box,
  DateTimePicker,
  JSONInput,
  NumberInput,
  Textarea,
  TextInput,
  ToggleCheckbox,
  Typography,
} from '@strapi/design-system';

import { getTrad } from '../utils/get-trad';
import { getFieldType } from '../utils/get-field-type';
import { MediaField } from './common/media-field';
import { RelationField } from './relation-field';

type RenderFieldProps = {
  hideAccordion?: boolean;
  setRevisedFields?: (...args: any[]) => any;
  name: string;
  value: any;
  layout: any;
};

export function RenderField(props: RenderFieldProps) {
  const { name, value, setRevisedFields, hideAccordion, layout } = props;

  const { formatMessage } = useIntl();

  const { attributes } = layout;

  /** get the schema attributes and handle unknown types as strings */
  const fieldAttr = attributes[name];
  const { type } = fieldAttr;
  const validType = getFieldType(type);

  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState(false);

  const fieldsElements = useMemo(
    () => (
      <Box padding={3}>
        {hideAccordion && (
          <Box paddingBottom={2}>
            <Typography variant='beta'>{name}:</Typography>
          </Box>
        )}
        {validType === 'datetime' && (
          <DateTimePicker
            aria-label={formatMessage({
              id: getTrad('plugin.admin.versionTrail.timePicker'),
              defaultMessage: 'Time picker',
            })}
            disabled={true}
            name={`datetimepicker-${name}`}
            step={15}
            selectedDateLabel={() => 'Date picker, current is undefined'}
            value={value}
          />
        )}
        {['string', 'enumeration', 'email', 'biginteger', 'uid'].includes(
          validType,
        ) && (
          <TextInput
            aria-label={formatMessage({
              id: getTrad('plugin.admin.versionTrail.string'),
              defaultMessage: 'String',
            })}
            name={`string-${name}`}
            value={value ? value : ''}
            disabled
          />
        )}
        {['integer', 'decimal', 'float'].includes(validType) && (
          <NumberInput
            aria-label={formatMessage({
              id: getTrad('plugin.admin.versionTrail.number'),
              defaultMessage: 'Number',
            })}
            placeholder='This is a content placeholder'
            name={`number-${name}`}
            value={value}
            disabled={true}
          />
        )}
        {['text', 'richtext'].includes(validType) && (
          <Textarea
            aria-label={formatMessage({
              id: getTrad('plugin.admin.versionTrail.text'),
              defaultMessage: 'Text',
            })}
            name={`text-${name}`}
            disabled={true}
          >
            {value}
          </Textarea>
        )}
        {validType === 'boolean' && (
          <ToggleCheckbox
            onLabel={formatMessage({
              id: getTrad('plugin.admin.versionTrail.true'),
              defaultMessage: 'True',
            })}
            offLabel={formatMessage({
              id: getTrad('plugin.admin.versionTrail.false'),
              defaultMessage: 'False',
            })}
            checked={value}
            disabled={true}
          />
        )}
        {/* TODO: investigated a better way of managing this, and flag it in the readme as a risk */}
        {['json', 'dynamiczone', 'component'].includes(validType) && (
          <JSONInput value={JSON.stringify(value, null, 2)} />
        )}
        {validType === 'media' && (
          <MediaField media={value} attributes={fieldAttr} />
        )}
        {validType === 'relation' && (
          <RelationField relation={value} attributes={fieldAttr} />
        )}
      </Box>
    ),
    [fieldAttr, formatMessage, hideAccordion, name, validType, value],
  );

  return (
    <Box padding={4} background='neutral100'>
      {!hideAccordion && (
        <Accordion
          expanded={expanded}
          onToggle={() => setExpanded((s) => !s)}
          id={`acc-field-pt-${name}`}
        >
          <AccordionToggle
            togglePosition='right'
            title={name}
            description={
              validType === type
                ? validType
                : `${type} (${formatMessage({
                    id: getTrad('plugin.admin.versionTrail.asString'),
                    defaultMessage: 'As string',
                  })})`
            }
            action={
              <BaseCheckbox
                aria-label={formatMessage({
                  id: getTrad('plugin.admin.versionTrail.selectRevision'),
                  defaultMessage: 'Select revision',
                })}
                name={name}
                onValueChange={(value) => {
                  setSelected(value);
                  setRevisedFields?.(name, value);
                }}
                value={selected}
              />
            }
          />
          <AccordionContent>{fieldsElements}</AccordionContent>
        </Accordion>
      )}
      {hideAccordion && fieldsElements}
    </Box>
  );
}
