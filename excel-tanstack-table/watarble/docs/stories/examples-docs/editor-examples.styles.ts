import { css } from '@linaria/core';

/** basic styles for table */
export const tableBaseCss = css`
  table {
    border: 1px solid black;
    /** applies only when border-collapse is separate */
    border-spacing: 0;
  }

  tr {
    :last-child {
      td {
        border-bottom: 0;
      }
    }
  }

  th,
  td {
    margin: 0;
    padding: 0.5rem;
    border-bottom: 1px solid black;
    border-right: 1px solid black;

    :last-child {
      border-right: 0;
    }
  }

  tfoot {
    tr:first-of-type {
      td,
      th {
        border-top: 2px solid black;
      }
    }
    font-weight: bold;
  }
`;
