export const addColumnToTableHook = ({ displayedHeaders, layout }) => {
  const { options } = layout;
  const isVersioned = options?.versions?.versioned;
  // console.log(';; isVersioned, layout ', isVersioned, layout);

  if (!isVersioned) {
    return { displayedHeaders, layout };
  }

  return {
    displayedHeaders: [
      ...displayedHeaders,
      {
        attribute: { type: 'string' },
        label: {
          id: 'list-view.table.header.label',
          defaultMessage: 'Ver.',
        },
        searchable: false,
        sortable: false,
        name: 'versionNumber',
        // @ ts-expect-error – ID is seen as number | string; this will change when we move the type over.
        // cellFormatter: (props, _header, meta) => <LocaleListCell {...props} {...meta} />,
        // key: '__version_key__',
        // fieldSchema: { type: 'integer' },
        // metadatas: { label: 'Version', searchable: true, sortable: true },
        // name: 'versionNumber',
        cellFormatter: (props) => {
          return props.versionNumber;
        },
      },
    ],
    layout,
  };
};
