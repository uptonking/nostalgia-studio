# nosontable-react

## About

This is a fork of @handsontable/react to and is designed to work with nosontable, a fork of the last MIT release of Handsontable

This fork was created to address the lack of security updates to version 6.2.2 of Handsontable, no new features are planned here, just dependency updates and some performance improvements.

## Installation

Use npm to install this wrapper together with Handsontable.
```
npm install opentable opentable-react
```

## Usage

Use this data grid as you would any other component in your application. [Options](//handsontable.com/docs/Options.html) can be set as `HotTable` props.

**Styles**
```css
@import '~opentable/dist/handsontable.full.css';
```

**React Component**
```js
import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from 'opentable-react';

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

We provide support for all users through [GitHub issues](//github.com/swsvindland/opentable-react). If you have a commercial license then you can add a new ticket through the [contact form](//handsontable.com/contact?category=technical_support).

If you would like to contribute to this project, make sure you first read the [guide for contributors](//github.com/swsvindland/opentable-react/blob/master/CONTRIBUTING.md).

## Browser compatibility

Opentable is compatible with modern browsers such as Chrome, Firefox, Safari, Opera, and Edge. It also supports Internet Explorer 11 but with limited performance.

### IE11 Support
Note: IE 11 will not be supported past June 15th, 2022 as per [Microsoft](//docs.microsoft.com/en-us/lifecycle/faq/internet-explorer-microsoft-edge)

## License

This wrapper is released under [the MIT license](//github.com/swsvindland/opentable-react/blob/master/LICENSE) but under the hood it uses [Handsontable](//github.com/swsvindland/opentable), which is also MIT licensed.

Created by [Handsoncode](//handsoncode.net) with ❤ and ☕ in [Tricity](//en.wikipedia.org/wiki/Tricity,_Poland).
Updated and maintained by [Sam Svindland](//svindland.dev)
