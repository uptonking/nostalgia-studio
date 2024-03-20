import React from 'react';

import { Translation } from 'react-i18next';

import {
  modalStyles,
  openConfirmModal,
  Text,
  type OpenConfirmModal,
} from '@datalking/pivot-ui';

export const confirmModal = (props: OpenConfirmModal) => {
  const open = () =>
    openConfirmModal({
      title: (
        <Translation>{(t) => t('Please confirm your action')}</Translation>
      ),
      children: (
        <Text size='sm'>
          <Translation>{(t) => t('Confirm action content')}</Translation>
        </Text>
      ),
      target: 'body',
      labels: {
        confirm: (
          <Translation>{(t) => t('Confirm', { ns: 'common' })}</Translation>
        ),
        cancel: (
          <Translation>{(t) => t('Cancel', { ns: 'common' })}</Translation>
        ),
      },
      confirmProps: { color: 'red', ...props.confirmProps },
      centered: true,
      styles: modalStyles,
      ...props,
    });

  return open;
};
