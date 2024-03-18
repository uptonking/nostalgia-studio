import React from 'react';

import { type ITreeViewField } from '@datalking/pivot-core';
import { Box, Overlay } from '@datalking/pivot-ui';

import { useCurrentTable } from '../../hooks/use-current-table';
import { useCurrentView } from '../../hooks/use-current-view';
import { SelectTreeViewField } from './select-tree-view-field';
import { TreeViewBoard } from './tree-view-board';

// import loadable from '@loadable/component';
// const TreeViewBoard = loadable(() => import('./tree-view-board'));

export const TreeViewUI: React.FC = () => {
  const table = useCurrentTable();
  const view = useCurrentView();
  const fieldId = view.treeViewFieldId;

  if (fieldId.isNone()) {
    return (
      <Box h='100%' sx={{ position: 'relative' }}>
        <Overlay center>
          <Box w={500}>
            <SelectTreeViewField />
          </Box>
        </Overlay>
      </Box>
    );
  }

  const field = table.schema.getFieldById(fieldId.unwrap().value).unwrap();

  return <TreeViewBoard field={field as ITreeViewField} />;
};
