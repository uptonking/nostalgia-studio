import React, { useEffect, useState } from 'react';

import ContentEditable from 'react-contenteditable';

import { textInputCss } from '../styles';
import { ACTION_TYPES } from '../utils';

export function NumberCell({ initialValue, columnId, rowIndex, dataDispatch }) {
  const [value, setValue] = useState({ value: initialValue, update: false });

  function onChange(e) {
    setValue({ value: e.target.value, update: false });
  }

  function onBlur(e) {
    setValue((old) => ({ value: old.value, update: true }));
  }

  useEffect(() => {
    setValue({ value: initialValue, update: false });
  }, [initialValue]);

  useEffect(() => {
    if (value.update) {
      dataDispatch({
        type: ACTION_TYPES.Update_cell,
        columnId,
        rowIndex,
        value: value.value,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.update, columnId, rowIndex]);

  return (
    <ContentEditable
      html={(value.value && value.value.toString()) || ''}
      onChange={onChange}
      onBlur={onBlur}
      className={textInputCss}
    />
  );
}
