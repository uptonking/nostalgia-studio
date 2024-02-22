import { EventEmitter } from 'events';

function listenerCount(ee, type) {
  return 'listenerCount' in ee
    ? ee.listenerCount(type)
    : EventEmitter.listenerCount(ee, type);
}

export default listenerCount;
