# nosontable
- nosontable is an open source JavaScript/HTML5 data grid component with spreadsheet look & feel. 
- It easily integrates with any data source and comes with a variety of useful features like data binding, validation, sorting or powerful context menu. 

> It is forked from HandsonTable community edition 6.2.2 before it was closed-sourced at version 7. 

## Table of contents

- [nosontable](#nosontable)
  - [Table of contents](#table-of-contents)
    - [What to use it for?](#what-to-use-it-for)
    - [Installation](#installation)
    - [Basic usage](#basic-usage)
    - [Examples](#examples)
    - [Features](#features)
    - [Screenshot](#screenshot)
    - [Resources](#resources)
    - [Wrappers](#wrappers)
    - [License](#license)

### What to use it for?

The list below gives a rough idea on what you can do with nosontable, but it shouldn't limit you in any way:

- Database editing
- Configuration controlling
- Data merging
- Team scheduling
- Sales reporting
- Financial analysis

### Installation

There are many ways to install nosontable, but we suggest using npm:

```
npm install nosontable
```

**Alternative ways to install**
- See the releases page for downloadable zips

### Basic usage

Assuming that you have already installed nosontable, create an empty `<div>` element that will be turned into a spreadsheet:

```html
<div id="example"></div>
```

In the next step, pass a reference to that `<div>` element into the nosontable constructor and fill the instance with sample data:

```javascript
const data = [
  ["", "Tesla", "Volvo", "Toyota", "Honda"],
  ["2017", 10, 11, 12, 13],
  ["2018", 20, 11, 14, 13],
  ["2019", 30, 15, 12, 13]
];

const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true
});
```

### Examples

- [See a live demo](//handsontable.com/examples.html)

### Features

**Some of the most popular features include:**

- Sorting data
- Data validation
- Conditional formatting
- Freezing rows/columns
- Merging cells
- Defining custom cell types
- Moving rows/columns
- Resizing rows/columns
- Context menu
- Adding comments to cells
- Dragging fill handle to populate data
- Internationalization
- Non-contiguous selection

[See a comparison table](//handsontable.com/docs/tutorial-features.html)

### Screenshot

<div align="center">
<a href="//handsontable.com/examples.html">
<img src="https://raw.githubusercontent.com/handsontable/static-files/master/Images/Screenshots/handsontable-ce-showcase.png" align="center" alt="Handsontable Community Edition Screenshot"/>
</a>
</div>

### Resources

- [API Reference](//handsontable.com/docs/Core.html)
- [Compatibility](//handsontable.com/docs/tutorial-compatibility.html)
- [Change log](//github.com/handsontable/handsontable/releases)
- [Roadmap](//trello.com/b/PztR4hpj)
- [Newsroom twitter](//twitter.com/handsontable)

### Wrappers

Handsontable CE comes with wrappers and directives for most popular frameworks:

- [React](//github.com/handsontable/react-handsontable)
- [Vue](//github.com/handsontable/vue-handsontable-official)
- [Angular](//github.com/handsontable/angular-handsontable)
- [Typescript file](//github.com/handsontable/handsontable/blob/master/handsontable.d.ts)

### License

Handsontable Community Edition is released under the MIT license. 
