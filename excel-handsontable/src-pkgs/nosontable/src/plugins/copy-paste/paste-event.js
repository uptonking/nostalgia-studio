import ClipboardData from './clipboard-data';

export default class PasteEvent {
  constructor() {
    this.clipboardData = new ClipboardData();
  }
}
