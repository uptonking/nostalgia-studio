import React, { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionToggle,
} from '@strapi/design-system/Accordion';
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { Box } from '@strapi/design-system/Box';

export function TablesAccordion({ children, table, ...rest }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Accordion
      expanded={expanded}
      onToggle={() => setExpanded((s) => !s)}
      id='acc-1'
      size='S'
      {...rest}
    >
      <AccordionToggle title={table} />
      <AccordionContent>
        <Box padding={3}>{children}</Box>
      </AccordionContent>
    </Accordion>
  );
}
