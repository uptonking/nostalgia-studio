import './css/bootstrap.css';
import './css/handsontable.css';
import './css/mobile.handsontable.css';

import {
  getCellType,
  getRegisteredCellTypeNames,
  registerCellType,
} from './cell-types';
import Core from './core';
import DefaultSettings from './default-settings';
import { getEditor, getRegisteredEditorNames, registerEditor } from './editors';
import EventManager, { getListenersCounter } from './event-manager';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as dateHelpers from './helpers/date';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';
import * as featureHelpers from './helpers/feature';
import * as functionHelpers from './helpers/function';
import jQueryWrapper from './helpers/jquery-wrapper';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as settingHelpers from './helpers/setting';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import { getTranslatedPhrase } from './i18n';
import * as constants from './i18n/constants';
import {
  getLanguageDictionary,
  getLanguagesDictionaries,
  registerLanguageDictionary,
} from './i18n/dictionaries-manager';
import Hooks from './plugin-hooks';
import { registerPlugin } from './plugins';
import * as plugins from './plugins/index';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from './renderers';
import GhostTable from './utils/ghost-table';
import { rootInstanceSymbol } from './utils/root-instance';
import {
  getRegisteredValidatorNames,
  getValidator,
  registerValidator,
} from './validators';

function Handsontable(rootElement, userSettings) {
  const instance = new Core(
    rootElement,
    userSettings || {},
    rootInstanceSymbol,
  );

  instance.init();

  return instance;
}

jQueryWrapper(Handsontable);

Handsontable.Core = Core;
Handsontable.DefaultSettings = DefaultSettings;
Handsontable.EventManager = EventManager;
Handsontable._getListenersCounter = getListenersCounter; // For MemoryLeak tests

Handsontable.buildDate = process.env.HOT_BUILD_DATE;
// Handsontable.packageName = process.env.HOT_PACKAGE_NAME;
Handsontable.packageName = 'nosontable';
// Handsontable.version = process.env.HOT_VERSION;
Handsontable.version = '0.0.1111';
// const baseVersion = process.env.HOT_BASE_VERSION;
// if (baseVersion) {
//   Handsontable.baseVersion = baseVersion;
// }

// Export Hooks singleton
Handsontable.hooks = Hooks.getSingleton();

// TODO: Remove this exports after rewrite tests about this module
Handsontable.__GhostTable = GhostTable;

// Export all helpers to the Handsontable object
const HELPERS = [
  arrayHelpers,
  browserHelpers,
  dataHelpers,
  dateHelpers,
  featureHelpers,
  functionHelpers,
  mixedHelpers,
  numberHelpers,
  objectHelpers,
  settingHelpers,
  stringHelpers,
  unicodeHelpers,
];
const DOM = [domHelpers, domEventHelpers];

Handsontable.helper = {};
Handsontable.dom = {};

// Fill general helpers.
arrayHelpers.arrayEach(HELPERS, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// Fill DOM helpers.
arrayHelpers.arrayEach(DOM, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});

// Export cell types.
Handsontable.cellTypes = {};

arrayHelpers.arrayEach(getRegisteredCellTypeNames(), (cellTypeName) => {
  Handsontable.cellTypes[cellTypeName] = getCellType(cellTypeName);
});

Handsontable.cellTypes.registerCellType = registerCellType;
Handsontable.cellTypes.getCellType = getCellType;

// Export all registered editors from the Handsontable.
Handsontable.editors = {};

arrayHelpers.arrayEach(getRegisteredEditorNames(), (editorName) => {
  Handsontable.editors[`${stringHelpers.toUpperCaseFirst(editorName)}Editor`] =
    getEditor(editorName);
});

Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;

// Export all registered renderers from the Handsontable.
Handsontable.renderers = {};

arrayHelpers.arrayEach(getRegisteredRendererNames(), (rendererName) => {
  const renderer = getRenderer(rendererName);
  if (rendererName === 'base') {
    Handsontable.renderers.cellDecorator = renderer;
  }
  Handsontable.renderers[
    `${stringHelpers.toUpperCaseFirst(rendererName)}Renderer`
  ] = renderer;
});

Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;

// Export all registered validators from the Handsontable
Handsontable.validators = {};

arrayHelpers.arrayEach(getRegisteredValidatorNames(), (validatorName) => {
  Handsontable.validators[
    `${stringHelpers.toUpperCaseFirst(validatorName)}Validator`
  ] = getValidator(validatorName);
});

Handsontable.validators.registerValidator = registerValidator;
Handsontable.validators.getValidator = getValidator;

// Export all registered plugins from the Handsontable.
Handsontable.plugins = {};

arrayHelpers.arrayEach(Object.getOwnPropertyNames(plugins), (pluginName) => {
  // eslint-disable-next-line import/namespace
  const plugin = plugins[pluginName];

  if (pluginName === 'Base') {
    Handsontable.plugins[`${pluginName}Plugin`] = plugin;
  } else {
    Handsontable.plugins[pluginName] = plugin;
  }
});

Handsontable.plugins.registerPlugin = registerPlugin;

Handsontable.languages = {};
Handsontable.languages.dictionaryKeys = constants;
Handsontable.languages.getLanguageDictionary = getLanguageDictionary;
Handsontable.languages.getLanguagesDictionaries = getLanguagesDictionaries;
Handsontable.languages.registerLanguageDictionary = registerLanguageDictionary;

// Alias to `getTranslatedPhrase` function, for more information check its API.
Handsontable.languages.getTranslatedPhrase = (...args) =>
  getTranslatedPhrase(...args);

export default Handsontable;

window['hotc'] = Handsontable;
