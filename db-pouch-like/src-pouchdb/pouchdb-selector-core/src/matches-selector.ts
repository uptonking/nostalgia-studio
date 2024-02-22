import { filterInMemoryFields } from './in-memory-filter';
import { massageSelector } from './utils';

/** return true if the given doc matches the supplied selector */
function matchesSelector(doc, selector) {
  /* istanbul ignore if */
  if (typeof selector !== 'object') {
    // match the CouchDB error message
    throw new Error('Selector error: expected a JSON object');
  }

  selector = massageSelector(selector);
  const row = {
    doc,
  };

  const rowsMatched = filterInMemoryFields(
    [row],
    { selector },
    Object.keys(selector),
  );
  return rowsMatched && rowsMatched.length === 1;
}

export { matchesSelector };
