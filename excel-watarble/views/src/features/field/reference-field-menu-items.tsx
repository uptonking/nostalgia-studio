import React from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import {
  type ParentField,
  type ReferenceField,
  type TreeField,
} from '@datalking/pivot-core';
import {
  Group,
  IconChevronRight,
  IconSearch,
  Menu,
  openContextModal,
  Text,
} from '@datalking/pivot-ui';

import { CREATE_FIELD_MODAL_ID } from '../../modals';
import { createFieldInitialValueAtom } from '../create-field-form/create-field-initial-value.atom';
import { FieldIcon } from '../field-inputs/field-Icon';
import { useMenuStyle } from './menu-item';

interface IProps {
  field: ReferenceField | TreeField | ParentField;
}
export const ReferenceFieldMenuItems: React.FC<IProps> = ({ field }) => {
  const { t } = useTranslation();
  const { classes } = useMenuStyle({});

  const setCreateFieldInitialValue = useSetAtom(createFieldInitialValueAtom);

  return (
    <>
      <Menu.Item className={classes.menu}>
        <Menu trigger='hover' position='right-start' width={180}>
          <Menu.Target>
            <Group position='apart' noWrap p={0}>
              <Group spacing='xs'>
                <IconSearch size={14} />
                <Text size='xs'>{t('Insert Lookup Fields')}</Text>
              </Group>
              <IconChevronRight color='gray' size={14} />
            </Group>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              icon={<FieldIcon type='lookup' />}
              className={classes.menu}
              onClick={() => {
                setCreateFieldInitialValue({
                  type: 'lookup',
                  referenceFieldId: field.id.value,
                  name: '',
                });
                openContextModal({
                  title: t('Create New Field'),
                  modal: CREATE_FIELD_MODAL_ID,
                  innerProps: {},
                });
              }}
            >
              {t('Insert Lookup Field')}
            </Menu.Item>
            {field.type !== 'parent' && (
              <>
                <Menu.Item
                  icon={<FieldIcon type='count' />}
                  className={classes.menu}
                  onClick={() => {
                    setCreateFieldInitialValue({
                      type: 'count',
                      referenceFieldId: field.id.value,
                      name: '',
                    });
                    openContextModal({
                      title: t('Create New Field'),
                      modal: CREATE_FIELD_MODAL_ID,
                      innerProps: {},
                    });
                  }}
                >
                  {t('Insert Count Field')}
                </Menu.Item>
                <Menu.Item
                  icon={<FieldIcon type='sum' />}
                  className={classes.menu}
                  onClick={() => {
                    setCreateFieldInitialValue({
                      type: 'sum',
                      referenceFieldId: field.id.value,
                      name: '',
                    });
                    openContextModal({
                      title: t('Create New Field'),
                      modal: CREATE_FIELD_MODAL_ID,
                      innerProps: {},
                    });
                  }}
                >
                  {t('Insert Sum Field')}
                </Menu.Item>
                <Menu.Item
                  icon={<FieldIcon type='average' />}
                  className={classes.menu}
                  onClick={() => {
                    setCreateFieldInitialValue({
                      type: 'average',
                      referenceFieldId: field.id.value,
                      name: '',
                    });
                    openContextModal({
                      title: t('Create New Field'),
                      modal: CREATE_FIELD_MODAL_ID,
                      innerProps: {},
                    });
                  }}
                >
                  {t('Insert Average Field')}
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Menu.Item>
    </>
  );
};
