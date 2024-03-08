import * as React from 'react';

import type { ErrorsType } from '../../types';

export function ListErrors({ errors }: { errors: ErrorsType }) {
  return (
    <ul className='error-messages'>
      {Object.entries(errors).map(([key, keyErrors], index) =>
        keyErrors.map((error) => (
          <li key={index}>
            {key} {error}
          </li>
        )),
      )}
    </ul>
  );
}

export default ListErrors;
