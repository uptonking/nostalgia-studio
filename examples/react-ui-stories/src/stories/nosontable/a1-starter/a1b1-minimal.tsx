import React, { useCallback, useEffect, useState } from 'react';

import { HotTable } from '@datalking/nosontable-react';

export const NosontableMinimal = () => {
  const [data, setData] = useState<(string | number)[][]>([[]]);

  // useEffect(() => {
  //   setData([
  //     ['Tesla', 'Model 3', 'BlueStar', 'USA', '★★★★'],
  //     ['Tesla', 'Model S', 'WhiteStar', 'USA', '★★★★★'],
  //     ['Mitsubishi', 'iMiEV', '', 'Japan', '★★'],
  //     ['Ford', 'Focus EV', '', 'USA', '★★'],
  //     ['Mitsubishi', 'iMiEV Sport', '', 'Japan', '★★'],
  //     ['Tesla', 'Roadster', 'DarkStar', 'USA', '★★★★★'],
  //     ['Volkswagen', 'e-Golf', '', 'Germany', '★★'],
  //     ['Volkswagen', 'E-Up!', '', 'Germany', '★★'],
  //     ['Ford', 'C-Max Energi', '', 'USA', '★'],
  //     ['BYD', 'Denza', '', 'China', '★★★'],
  //     ['BYD', 'e5', '', 'China', '★★★'],
  //     ['BYD', 'e6', '', 'China', '★★★★'],
  //   ]);
  // }, []);

  const afterChanges = useCallback(
    (changes: [number, string | number, any, any][], source: string) => {
      console.log(changes, source);
    },
    [],
  );

  return (
    <div>
      <HotTable
        data={data}
        minRows={100}
        minCols={12}
        minSpareRows={4}
        afterChange={afterChanges}
        debug={true}
        // colHeaders={[
        //   'Code name',
        //   'Country of origin',
        //   'Rank',
        // ]}
        colHeaders={true}
        rowHeaders={true}
        columnSorting={true}
        manualColumnMove={true}
        manualColumnResize={true}
      />
    </div>
  );
};
