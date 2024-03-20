import React from 'react';

import { Box } from '@strapi/design-system/Box';

import { FieldsCheckbox } from './fields-checkbox';
import { TablesAccordion } from './tables-accordion';

export function RenderDeeplyNestedObject({
  data,
  toggleSelectedOfField,
  toggleSelectedOfMedia,
}) {
  let { table, fields, populate, media } = data;

  return (
    <>
      <Box padding={8} background='neutral100'>
        <TablesAccordion table={table}>
          <ul>
            {fields.map((field) => {
              return (
                <FieldsCheckbox
                  key={field.name}
                  table={table}
                  field={field}
                  toggleSelectedOfField={toggleSelectedOfField}
                />
              );
            })}

            {media.map((item) => {
              return (
                <FieldsCheckbox
                  key={item.name}
                  table={table}
                  field={item}
                  toggleSelectedOfField={toggleSelectedOfMedia}
                />
              );
            })}

            {populate &&
              Array.isArray(populate) &&
              populate.length &&
              populate.map((item) => (
                <RenderDeeplyNestedObject
                  data={item}
                  toggleSelectedOfField={toggleSelectedOfField}
                />
              ))}
          </ul>
        </TablesAccordion>
      </Box>
    </>
  );
}
