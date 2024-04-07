# nosontable-react

This is a fork of `@handsontable/react.v2.1.0` to and is designed to work with nosontable, a fork of the last MIT release of Handsontable

## Installation

Use npm to install this wrapper together with Handsontable.

```
npm install nosontable nosontable-react
```

## Usage

Use this data grid as you would any other component in your application. [Options](//handsontable.com/docs/Options.html) can be set as `HotTable` props.

**Styles**

```css
@import '~nosontable/dist/handsontable.css';
```

**React Component**

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from 'nosontable-react';

class HotApp extends React.Component {
  constructor(props) {
    super(props);
    this.data = [
      ['', 'Tesla', 'Mercedes', 'Toyota', 'Volvo'],
      ['2019', 10, 11, 12, 13],
      ['2020', 20, 11, 14, 13],
      ['2021', 30, 15, 12, 13]
    ];
  }

  render() {
    return (<HotTable data={this.data} colHeaders={true} rowHeaders={true} width="600" height="300" />);
  }
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

## Support and contribution

We provide support for all users through [GitHub issues](//github.com/swsvindland/nosontable-react). If you have a commercial license then you can add a new ticket through the [contact form](//handsontable.com/contact?category=technical_support).

If you would like to contribute to this project, make sure you first read the [guide for contributors](//github.com/swsvindland/nosontable-react/blob/master/CONTRIBUTING.md).

## Browser compatibility

nosontable is compatible with modern browsers such as Chrome, Firefox, Safari, Opera, and Edge. It also supports Internet Explorer 11 but with limited performance.

## License

This wrapper is released under the MIT license
