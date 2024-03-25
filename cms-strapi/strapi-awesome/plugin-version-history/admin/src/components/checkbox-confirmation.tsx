import React, { useState } from 'react';

import { useIntl } from 'react-intl';
import styled from 'styled-components';

import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogFooter,
  Flex,
  Stack,
  Typography,
} from '@strapi/design-system';
import { ExclamationMarkCircle } from '@strapi/icons';

import { getTrad } from '../utils';

const TextAlignTypography = styled(Typography)`
  text-align: center;
`;

type CheckboxConfirmationProps = {
  name: string;
  isCreating?: boolean;
  value: boolean;
  onChange: (...args: any[]) => void;
  description: {
    id: string;
    defaultMessage: string;
    values?: Record<string, string>;
  };
  intlLabel: {
    id: string;
    defaultMessage: string;
    values?: Record<string, string>;
  };
};

export const CheckboxConfirmation = (props: CheckboxConfirmationProps) => {
  const {
    description = null,
    isCreating = false,
    intlLabel,
    name,
    onChange,
    value,
  } = props;

  const { formatMessage } = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (value) => {
    if (isCreating || value) {
      return onChange({ target: { name, value, type: 'checkbox' } });
    }

    if (!value) {
      return setIsOpen(true);
    }

    return null;
  };

  const handleConfirm = () => {
    onChange({ target: { name, value: false, type: 'checkbox' } });
    setIsOpen(false);
  };

  const handleToggle = () => setIsOpen((prev) => !prev);

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values },
      )
    : name;

  const hint = description
    ? formatMessage(
        { id: description.id, defaultMessage: description.defaultMessage },
        { ...description.values },
      )
    : '';

  return (
    <>
      <Checkbox
        hint={hint}
        id={name}
        name={name}
        onValueChange={handleChange}
        value={value}
        type='checkbox'
      >
        {label}
      </Checkbox>
      {isOpen && (
        <Dialog onClose={handleToggle} title='Confirmation' isOpen={isOpen}>
          <DialogBody icon={<ExclamationMarkCircle />}>
            <Stack size={2}>
              <Flex justifyContent='center'>
                <TextAlignTypography id='confirm-description'>
                  {formatMessage({
                    id: getTrad('CheckboxConfirmation.Modal.content'),
                    defaultMessage:
                      'Disabling versioning will cause the deletion of all your content but the latest versions.',
                  })}
                </TextAlignTypography>
              </Flex>
              <Flex justifyContent='center'>
                <Typography fontWeight='semiBold' id='confirm-description'>
                  {formatMessage({
                    id: getTrad('CheckboxConfirmation.Modal.body'),
                    defaultMessage: 'Do you want to disable it?',
                  })}
                </Typography>
              </Flex>
            </Stack>
          </DialogBody>
          <DialogFooter
            startAction={
              <Button onClick={handleToggle} variant='tertiary'>
                {formatMessage({
                  id: 'components.popUpWarning.button.cancel',
                  defaultMessage: 'No, cancel',
                })}
              </Button>
            }
            endAction={
              <Button variant='danger-light' onClick={handleConfirm}>
                {formatMessage({
                  id: getTrad('CheckboxConfirmation.Modal.button-confirm'),
                  defaultMessage: 'Yes, disable',
                })}
              </Button>
            }
          />
        </Dialog>
      )}
    </>
  );
};
