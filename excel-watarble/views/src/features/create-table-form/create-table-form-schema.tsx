import React, { useLayoutEffect, useState } from 'react';

import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useFieldArray, useFormContext } from 'react-hook-form';

import type { ICreateTableInput } from '@datalking/pivot-cqrs';
import { Accordion, usePrevious } from '@datalking/pivot-ui';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { activeFieldAtom } from './create-table-form-schema.atom';
import { FieldAccordionItem } from './fields/field-accordion-item';

export const CreateTableFormSchema: React.FC = () => {
  const form = useFormContext<ICreateTableInput>();
  // @ts-ignore
  const { move } = useFieldArray<ICreateTableInput>({
    name: 'schema',
  });
  const [activeField, setActiveField] = useAtom(activeFieldAtom);
  const resetActiveField = useResetAtom(activeFieldAtom);

  const schema = form.watch('schema');

  const len = schema.length;
  const prevLen = usePrevious(len);

  const [duration, setDuration] = useState(100);

  useLayoutEffect(() => {
    if (len && len >= (prevLen || 0)) {
      const field = schema[len - 1];
      if (field) {
        setActiveField(String(len - 1));
      }
    }
  }, [len, schema]);

  const items = schema.map((field) => field.id!);
  return (
    <DndContext
      onDragStart={() => {
        setDuration(0);
        resetActiveField();
      }}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={(e) => {
        setDuration(100);
        const { over, active } = e;
        if (over) {
          move(
            active.data.current?.sortable?.index,
            over?.data.current?.sortable?.index,
          );
        }
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <Accordion
          value={activeField}
          variant='contained'
          onChange={setActiveField}
          transitionDuration={duration}
        >
          {schema.map((field, index) => (
            <FieldAccordionItem key={index} index={index} id={index} />
          ))}
        </Accordion>
      </SortableContext>
    </DndContext>
  );
};
