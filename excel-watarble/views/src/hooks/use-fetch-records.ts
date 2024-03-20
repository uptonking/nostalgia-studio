import type { IGetRecordsQuery } from '@datalking/pivot-cqrs';
import { useGetRecordsQuery } from '@datalking/pivot-store';

import { useCurrentTable } from './use-current-table';
import { useCurrentView } from './use-current-view';

export const useFetchRecords = (filter?: IGetRecordsQuery['filter']) => {
  const table = useCurrentTable();
  const view = useCurrentView();
  const arg: IGetRecordsQuery = {
    tableId: table.id.value,
    viewId: view.id.value,
    filter,
  };

  return useGetRecordsQuery(arg, {
    selectFromResult: (result) => ({
      ...result,
      rawRecords: (Object.values(result.data?.entities ?? {}) ?? []).filter(
        Boolean,
      ),
    }),
  });
};
