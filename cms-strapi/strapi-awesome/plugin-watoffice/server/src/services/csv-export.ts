import type { Core } from '@strapi/types';

function getFieldNamesFromItems(items: Array<{ string: unknown }>) {
  const fieldNames = new Set();
  items.forEach((item) => {
    try {
      Object.keys(item).forEach((fieldName) => fieldNames.add(fieldName));
    } catch (err) {
      console.error(err);
    }
  });

  return Array.from(fieldNames);
}

/** serialize an object to csv string */
function objectToCsv(data, headers) {
  const escapeQuote = (text) => text.replace(/"/g, '""');
  return headers
    .map((header) => {
      const element = data[header];
      if (element === null || element === undefined) return '';

      if (typeof element === 'object') {
        const textObject = JSON.stringify(element);
        return `"${escapeQuote(textObject)}"`;
      }

      if (
        typeof element === 'string' &&
        (element.includes('\n') ||
          element.includes(',') ||
          element.includes('"'))
      ) {
        return `"${escapeQuote(element)}"`;
      }

      return element;
    })
    .join();
}

export const csvExport = ({ strapi }: { strapi: Core.Strapi }) => ({
  async exportCSVData(contentType) {
    let shouldFetch = true;
    let offset = 0;
    const result = [];

    while (shouldFetch) {
      const data = await strapi.documents(contentType).findMany({
        sort: {
          id: 'asc',
        },
        start: offset,
        limit: 100,
      });

      result.push(...data);
      offset += 100;

      if (data.length === 0) {
        shouldFetch = false;
        break;
      }
    }

    // console.log(';; result ', result);

    const fields = getFieldNamesFromItems(result);
    const csv = result.map((item) => objectToCsv(item, fields)).join('\n');

    return { headers: fields, content: csv };
  },
});

export default csvExport;
