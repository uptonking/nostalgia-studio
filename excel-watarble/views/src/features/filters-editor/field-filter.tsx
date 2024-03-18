import React, { useEffect, useLayoutEffect, useState } from 'react';

import {
  type Field,
  type IFieldQueryValue,
  type IFilter,
  type IOperator,
  type TableSchema,
} from '@datalking/pivot-core';
import {
  ActionIcon,
  Group,
  IconGripVertical,
  IconTrash,
  usePrevious,
} from '@datalking/pivot-ui';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useOrderedFields } from '../../hooks/use-ordered-fields';
import { FieldSelector } from '../field-inputs/field-selector';
import { FilterValueInput } from './filter-value-input';
import { getFilterId } from './get-filter-id';
import { OperatorSelector } from './operator-selector';

interface IProps {
  schema: TableSchema;
  index: number;
  value: IFilter | null;
  onChange: (filter: IFilter | null, index: number) => void;
  onRemove: (index: number) => void;
}

export const FieldFilter: React.FC<IProps> = ({
  schema,
  value,
  onChange,
  onRemove,
  index,
}) => {
  // TODO: path maybe string list
  const fieldId = value?.path as string;
  const field = fieldId ? schema.getFieldById(fieldId).into(null) : null;

  const fields = useOrderedFields();

  const [selectedField, setField] = useState<Field | null>(field);
  const previousField = usePrevious(selectedField);
  const [operator, setOperator] = useState<IOperator | null>(
    value?.operator ?? null,
  );
  const [fieldValue, setValue] = useState<IFieldQueryValue | null>(
    (value?.value as never) ?? null,
  );

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: getFilterId(value, index) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (selectedField && operator) {
      onChange(
        selectedField.createFilter(operator as never, fieldValue as never),
        index,
      );
    } else {
      onChange(null, index);
    }
  }, [selectedField, operator, fieldValue]);

  useLayoutEffect(() => {
    if (
      selectedField &&
      previousField &&
      !selectedField.id.equals(previousField.id)
    ) {
      setValue(null);
    }
    if (!selectedField) {
      setOperator(null);
    }
  }, [previousField, selectedField]);

  return (
    <Group ref={setNodeRef} style={style} spacing='xs'>
      <ActionIcon {...attributes} {...listeners} component='a'>
        <IconGripVertical size={12} />
      </ActionIcon>
      <FieldSelector
        fields={fields.filter((f) => f.filterable)}
        value={selectedField}
        onChange={setField}
      />
      <OperatorSelector
        field={selectedField}
        value={operator}
        onChange={setOperator}
      />
      <FilterValueInput
        field={selectedField}
        value={fieldValue}
        onChange={setValue}
        operator={operator}
      />
      <ActionIcon
        color='gray.5'
        variant='outline'
        onClick={() => onRemove(index)}
      >
        <IconTrash size={12} />
      </ActionIcon>
    </Group>
  );
};
