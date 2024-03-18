import React from 'react';

import { format } from 'date-fns';
import { forIn } from 'lodash-es';
import { Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { type Field } from '@datalking/pivot-core';
import {
  ActionIcon,
  Center,
  Checkbox,
  ColorInput,
  DatePickerInput,
  Group,
  IconClipboardCheck,
  IconCopy,
  IconExternalLink,
  NumberInput,
  Rating,
  TextInput,
  useClipboard,
} from '@datalking/pivot-ui';

import { useColors } from '../../hooks/use-colors';
import { AutoIncrementInput } from '../field-inputs/auto-increment-input';
import { FieldIcon } from '../field-inputs/field-Icon';
import { FieldInputLabel } from '../field-inputs/field-input-label';
import { ParentRecordPicker } from '../field-inputs/parent-records-picker';
import { ReferenceRecordPicker } from '../field-inputs/reference-record-picker';
import { TreeRecordsPicker } from '../field-inputs/tree-records-picker';
import { UsersPicker } from '../field-inputs/users-picker';
import { FieldIssue } from '../field/field-issue';
import { OptionPicker } from '../option/option-picker';

// import { AttachmentInput } from '../field-inputs/attachment-input';

interface IProps {
  field: Field;
  name: string;
}

export const RecordInputFactory = ({ name, field }: IProps) => {
  const navigate = useNavigate();
  const { copy, copied } = useClipboard({ timeout: 1500 });
  const colors = useColors();

  const label = <FieldInputLabel>{field.name.value}</FieldInputLabel>;
  const description = field.description?.value;
  const required = field.required;

  if (field.type === 'number') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => {
          // console.log(';; NumberInput-pps ', field.name.value, field, form);
          // /fixme hack for 3rd components
          if (form.field.value == null) {
            if (field.name.value === 'year') {
              form.field.value = 2023;
            } else {
              form.field.value = 0;
            }
          }

          return (
            <NumberInput
              {...form.field}
              icon={<FieldIcon type={field.type} />}
              label={label}
              placeholder={description}
              onChange={(number) => form.field.onChange(number)}
              required={required}
              error={form.fieldState.error?.message}
            />
          );
        }}
      />
    );
  }
  if (field.type === 'rating') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <>
            <FieldInputLabel>{field.name.value}</FieldInputLabel>
            <Rating
              {...form.field}
              count={field.max}
              onChange={(number) => form.field.onChange(number)}
              placeholder={description}
            />
          </>
        )}
      />
    );
  }
  if (field.type === 'color') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <ColorInput
            {...form.field}
            icon={
              <FieldIcon type={field.type} color={form.field.value ?? 'gray'} />
            }
            label={label}
            onChange={(color) => form.field.onChange(color)}
            value={form.field.value ?? ''}
            swatches={colors}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
            withinPortal
          />
        )}
      />
    );
  }
  if (field.type === 'date') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <DatePickerInput
            label={label}
            icon={<FieldIcon type={field.type} />}
            {...form.field}
            value={form.field.value ? new Date(form.field.value) : null}
            onChange={(date) => form.field.onChange(date?.toISOString())}
            valueFormat={field.formatString.toUpperCase()}
            popoverProps={{ withinPortal: true }}
            clearable
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
          />
        )}
      />
    );
  }
  if (field.type === 'date-range') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <DatePickerInput
            type='range'
            label={label}
            {...form.field}
            clearable
            icon={<FieldIcon type={field.type} />}
            value={
              form.field.value
                ? [
                    form.field.value.at(0)
                      ? new Date(form.field.value.at(0))
                      : null,
                    form.field.value.at(1)
                      ? new Date(form.field.value.at(1))
                      : null,
                  ]
                : [null, null]
            }
            onChange={(value) =>
              form.field.onChange(
                value
                  ? [
                      value.at(0)?.toISOString() ?? null,
                      value.at(1)?.toISOString(),
                    ]
                  : null,
              )
            }
            valueFormat={field.formatString.toUpperCase()}
            popoverProps={{ withinPortal: true }}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
          />
        )}
      />
    );
  }
  if (field.type === 'bool') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <Checkbox
            lh={1}
            key={field.id.value}
            {...form.field}
            checked={form.field.value}
            label={label}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
          />
        )}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <OptionPicker
            field={field}
            icon={<FieldIcon type={field.type} />}
            label={label}
            {...form.field}
            onChange={(value) => form.field.onChange(value)}
            value={form.field.value ?? ''}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
            withinPortal
          />
        )}
      />
    );
  }

  if (field.type === 'collaborator') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <UsersPicker
            {...form.field}
            onChange={(value) => form.field.onChange(value)}
            value={form.field.value ?? []}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
            withinPortal
            disabled={field.hasIssue}
          />
        )}
      />
    );
  }

  if (field.type === 'reference') {
    const foreignTable = field.foreignTableId;
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <ReferenceRecordPicker
            field={field}
            label={
              <Center>
                {label}
                {field.hasIssue && (
                  <FieldIssue field={field} ml='xs' size={16} />
                )}
                {foreignTable.isSome() && (
                  <ActionIcon
                    tabIndex={-1}
                    ml='xs'
                    size='xs'
                    onClick={() => {
                      if (foreignTable.isSome()) {
                        navigate(`/t/${foreignTable.unwrap()}`);
                      }
                    }}
                  >
                    <IconExternalLink size={14} />
                  </ActionIcon>
                )}
              </Center>
            }
            {...form.field}
            onChange={(value) => form.field.onChange(value)}
            value={form.field.value ?? []}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
            withinPortal
            disabled={field.hasIssue}
          />
        )}
      />
    );
  }

  if (field.type === 'tree') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <TreeRecordsPicker
            field={field}
            label={label}
            onChange={(value) => form.field.onChange(value)}
            value={form.field.value ?? []}
            name={form.field.name}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
            withinPortal
          />
        )}
      />
    );
  }

  if (field.type === 'parent') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <ParentRecordPicker
            field={field}
            label={label}
            onChange={(value) => form.field.onChange(value)}
            value={form.field.value ?? ''}
            name={form.field.name}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
            withinPortal
          />
        )}
      />
    );
  }
  if (field.type === 'id') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <TextInput
            data-auto-focus
            disabled
            icon={<FieldIcon type={field.type} />}
            label={label}
            {...form.field}
            value={form.field.value ?? ''}
            rightSection={
              copied ? (
                <IconClipboardCheck size={14} color='green' />
              ) : (
                <IconCopy
                  size={14}
                  color='gray'
                  onClick={() => copy(form.field.value)}
                />
              )
            }
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
          />
        )}
      />
    );
  }

  // if (field.type === 'attachment') {
  //   return (
  //     <Controller
  //       name={name}
  //       rules={{ required: field.required }}
  //       render={(form) => (
  //         <>
  //           <Group spacing='xs'>
  //             <FieldIcon type={field.type} />
  //             <FieldInputLabel>{field.name.value}</FieldInputLabel>
  //           </Group>
  //           <AttachmentInput {...form.field} />
  //         </>
  //       )}
  //     />
  //   );
  // }

  if (field.type === 'created-at' || field.type === 'updated-at') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => {
          return (
            <TextInput
              data-auto-focus
              disabled
              icon={<FieldIcon type={field.type} />}
              label={label}
              {...form.field}
              value={
                form.field.value
                  ? format(new Date(form.field.value), field.formatString)
                  : ''
              }
              placeholder={description}
              required={required}
              error={form.fieldState.error?.message}
            />
          );
        }}
      />
    );
  }

  if (field.type === 'auto-increment') {
    return (
      <Controller
        name={name}
        rules={{ required: field.required }}
        render={(form) => (
          <AutoIncrementInput
            field={field}
            defaultValue={form.field.value}
            placeholder={description}
            required={required}
            error={form.fieldState.error?.message}
          />
        )}
      />
    );
  }

  if (field.type === 'lookup') {
    return null;
  }

  return (
    <Controller
      name={name}
      rules={{ required: field.required }}
      render={(form) => (
        <TextInput
          data-auto-focus
          disabled={field.system || field.controlled}
          icon={<FieldIcon type={field.type} />}
          label={label}
          {...form.field}
          value={form.field.value ?? ''}
          placeholder={description}
          required={required}
          error={form.fieldState.error?.message}
          readOnly={field.controlled}
        />
      )}
    />
  );
};
