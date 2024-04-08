# nosontable-react
- React wrapper for nosontable, a JavaScript data grid component with a spreadsheet look & feel

> This is a fork of `@handsontable/react.v2.1.0` and is designed to work with nosontable, a fork of the last MIT release of Handsontable

## Installation

Use npm to install this wrapper together with Handsontable.

```
npm install nosontable-react
```

## Usage

Use this data grid as you would any other component in your application. [Options](//handsontable.com/docs/Options.html) can be set as `HotTable` props.

**Styles**

```css
/* @import '~nosontable/dist/handsontable.css'; */
```

**React Component**

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from 'nosontable-react';

const data = [
  ['', 'Tesla', 'Mercedes', 'Toyota', 'Volvo'],
  ['2019', 10, 11, 12, 13],
  ['2020', 20, 11, 14, 13],
  ['2021', 30, 15, 12, 13]
];

function HotApp() {

  return (
    <HotTable
        data={data}
        colHeaders={true}
        rowHeaders={true}
        width='600'
        height='300'
      />
  );
}
```

## Features

A list of some of the most popular features:

- Multiple column sorting
- Non-contiguous selection
- Filtering data
- Export to file
- Validating data
- Conditional formatting
- Merging cells
- Custom cell types
- Freezing rows/columns
- Moving rows/columns
- Resizing rows/columns
- Hiding rows/columns
- Context menu
- Comments
- Auto-fill option

## Documentation

- [Developer guides](//handsontable.com/docs/react)
- [API Reference](//handsontable.com/docs/Core.html)
- [Release notes](//handsontable.com/docs/tutorial-release-notes.html)
- [Twitter](//twitter.com/handsontable) (News and updates)

## Browser compatibility

nosontable is compatible with modern browsers such as Chrome, Firefox, Safari, Opera, and Edge. It also supports Internet Explorer 11 but with limited performance.

## License

This wrapper is released under the MIT license
