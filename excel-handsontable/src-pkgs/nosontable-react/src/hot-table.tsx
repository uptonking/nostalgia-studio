import React, { Component, type CSSProperties, type ReactNode } from 'react';

import Handsontable from 'nosontable';

import { SettingsMapper } from './settings-mapper';

/**
 * Interface for the `prop` of the HotTable component - extending the default Handsontable settings with additional,
 * component-related properties.
 */
export interface HotTableProps extends Handsontable.DefaultSettings {
  data?: any[][] | object[];
  id?: string;
  className?: string;
  style?: CSSProperties;
  settings?: Handsontable.DefaultSettings;
}

/**
 * A Handsontable-ReactJS wrapper.
 *
 * To implement, use the `HotTable` tag with properties corresponding to Handsontable options.
 * For example:
 *
 * ```js
 * <HotTable id="hot" data={dataObject} contextMenu={true} colHeaders={true} width={600} height={300} stretchH="all" />
 *
 * // is analogous to
 * let hot = new Handsontable(document.getElementById('hot'), {
 *    data: dataObject,
 *    contextMenu: true,
 *    colHeaders: true,
 *    width: 600
 *    height: 300
 * });
 *
 * ```
 */
export class HotTable extends Component<HotTableProps, {}> {
  /**
   * Reference to the `SettingsMapper` instance.
   */
  private settingsMapper = new SettingsMapper();
  /**
   * The `id` of the main Handsontable DOM element.
   */
  id: string = null;
  /**
   * Reference to the Handsontable instance.
   */
  hotInstance: Handsontable = null;
  /**
   * Reference to the main Handsontable DOM element.
   */
  hotElementRef: HTMLElement = null;
  /**
   * Class name added to the component DOM element.
   */
  className: string;
  /**
   * Style object passed to the component.
   */
  style: React.CSSProperties;

  /**
   * Set the reference to the main Handsontable DOM element.
   *
   * @param {HTMLElement} element The main Handsontable DOM element.
   */
  private setHotElementRef(element: HTMLElement): void {
    this.hotElementRef = element;
  }

  /**
   * Initialize Handsontable after the component has mounted.
   */
  componentDidMount(): void {
    const newSettings = this.settingsMapper.getSettings(this.props);
    this.hotInstance = new Handsontable(this.hotElementRef, newSettings);
    // todo remove log
    window['hot'] = this.hotInstance;
  }

  /**
   * Call the `updateHot` method and prevent the component from re-rendering the instance.
   */
  shouldComponentUpdate(nextProps: HotTableProps, nextState): boolean {
    this.updateHot(this.settingsMapper.getSettings(nextProps));
    return false;
  }

  /**
   * Destroy the Handsontable instance when the parent component unmounts.
   */
  componentWillUnmount(): void {
    this.hotInstance.destroy();
  }

  /**
   * Render the table.
   */
  render() {
    this.id = this.props.id || 'hot-' + Math.random().toString(36).substring(5);
    this.className = this.props.className || '';
    this.style = this.props.style || {};

    return (
      <div
        ref={this.setHotElementRef.bind(this)}
        id={this.id}
        className={this.className}
        style={this.style}
      />
    );
  }

  /**
   * Call the `updateSettings` method for the Handsontable instance.
   */
  private updateHot(newSettings: Handsontable.DefaultSettings): void {
    this.hotInstance.updateSettings(newSettings, false);
  }
}
