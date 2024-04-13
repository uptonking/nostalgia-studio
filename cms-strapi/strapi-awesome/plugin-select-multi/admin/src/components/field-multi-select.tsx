import React, { useMemo } from 'react';

import { useIntl } from 'react-intl';
import styled from 'styled-components';

import {
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  Flex,
  Tag,
} from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { type InputProps, useField } from '@strapi/strapi/admin';

import { getTrad } from '../utils/getTranslation';
import { ReactSelect } from './react-select';

const CustomMultiValueContainer = (props) => {
  const { selectProps } = props;
  const handleTagClick = (value) => (e) => {
    e.preventDefault();
    selectProps.onChange(selectProps.value.filter((v) => v !== value));
  };
  return (
    <Tag
      type='button'
      tabIndex={-1}
      icon={<Cross />}
      onClick={handleTagClick(props.data)}
    >
      {props.data.label}
    </Tag>
  );
};

const StyleSelect = styled(ReactSelect)`
  .select-control {
    height: auto;

    & > div:first-child {
      padding: 4px;
      gap: 4px;

      & > div {
        padding-left: 8px;
      }
    }

    .select-multi-value-container {
      margin-right: -8px;
    }
  }
`;

type MultiSelectProps = {
  attribute: Record<string, any>;
  name: string;
  description: string;
  disabled: boolean;
  required: boolean;
  error: string;
  placeholder?: string;
  hint?: string;
  label?: string;
  labelAction: Record<string, string>;
};

export const MultiSelect = (props: MultiSelectProps) => {
  const {
    name,
    label,
    required = false,
    attribute,
    description = null,
    placeholder,
    hint,
    disabled = false,
    labelAction,
  } = props;

  const { formatMessage } = useIntl();

  const { onChange, value = '', error } = useField(name);

  const possibleOptions = useMemo(() => {
    return (attribute['options'] || [])
      .map((option) => {
        const [label, value] = [...option.split(/:(.*)/s), option];
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean);
  }, [attribute]);

  const sanitizedValue = useMemo(() => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(value || '[]');
    } catch (e) {
      parsedValue = [];
    }
    return Array.isArray(parsedValue)
      ? possibleOptions.filter((option) =>
          parsedValue.some((val) => option.value === val),
        )
      : [];
  }, [value, possibleOptions]);

  const fieldError = useMemo(() => {
    return (
      error || (required && !possibleOptions.length ? 'No options' : undefined)
    );
  }, [required, error, possibleOptions]);

  console.log(';; multi-select ', props, fieldError);

  return (
    <Field
      id={name}
      name={name}
      hint={hint}
      error={fieldError}
      required={required}
    >
      <Flex direction='column' alignItems='stretch' gap={1}>
        {/* <FieldLabel>
          {formatMessage({
            id: getTrad('plugin.select.label'),
            defaultMessage: props.label || 'multi-select',
          })}
        </FieldLabel> */}
        <FieldLabel action={labelAction}>{label}</FieldLabel>
        <StyleSelect
          isSearchable
          isMulti
          error={fieldError}
          name={name}
          id={name}
          disabled={disabled || possibleOptions.length === 0}
          placeholder={placeholder}
          defaultValue={sanitizedValue.map((val) => ({
            label: formatMessage({
              id: val.label,
              defaultMessage: val.label,
            }),
            value: val.value,
          }))}
          components={{
            MultiValueContainer: CustomMultiValueContainer,
          }}
          options={possibleOptions.map((option) => ({
            ...option,
            label: formatMessage({
              id: option.label,
              defaultMessage: option.label,
            }),
          }))}
          onChange={(val: any) => {
            onChange?.(
              name,
              val?.length && val.filter((v) => !!v)
                ? JSON.stringify(val.filter((v) => !!v).map((v) => v.value))
                : null,
            );
          }}
          classNames={{
            control: (_state) => 'select-control',
            multiValue: (_state) => 'select-multi-value',
            placeholder: (_state) => 'select-placeholder',
          }}
        />
        <FieldHint />
        <FieldError />
      </Flex>
    </Field>
  );
};

export default MultiSelect;
