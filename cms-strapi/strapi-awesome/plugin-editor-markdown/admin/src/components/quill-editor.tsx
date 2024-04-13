import 'react-quill/dist/quill.snow.css';

import React, { useState } from 'react';

import ReactQuill from 'react-quill';

import { Button, Field, FieldLabel, Flex, Stack } from '@strapi/design-system';

// import { useLibrary, prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';

export const QuillEditor = ({ onChange, name, value }) => {
  const modules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <ReactQuill
      theme='snow'
      value={value}
      modules={modules}
      onChange={(content, event, editor) => {
        onChange({ target: { name, value: content } });
      }}
    />
  );
};

export const FieldQuillEditor = ({ name, onChange, value }) => {
  const [showMediaLibDialog, setShowMediaLibDialog] = useState(false);
  // const { components } = useLibrary();
  // const MediaLibDialog = components['media-library'];

  const handleToggleMediaLibDialog = () => {
    setShowMediaLibDialog(!showMediaLibDialog);
  };

  const handleSelectAssets = (files) => {
    // const formattedFiles = files.map(file => ({
    //     alt: file.alternativeText || file.name,
    //     url: prefixFileUrlWithBackendUrl(file.url),
    //     mime: file.mime,
    // }));
    // const images = formattedFiles.map(image => `<image src='${image.url}' alt='${image.alt}'>`).join();
    // onChange({
    //     target: {
    //         name: name,
    //         value: value + images
    //     }
    // });
    handleToggleMediaLibDialog();
  };

  return (
    <div>
      <Field name={name}>
        <Button variant='secondary' onClick={handleToggleMediaLibDialog}>
          MediaLib
        </Button>
        <Stack size={2} padding={2}>
          <Flex>
            <FieldLabel>{name}</FieldLabel>
          </Flex>
          <QuillEditor name={name} onChange={onChange} value={value} />
        </Stack>
        {
          // showMediaLibDialog
          // &&
          // <MediaLibDialog
          //     onClose={handleToggleMediaLibDialog}
          //     onSelectAssets={handleSelectAssets}
          // />
        }
      </Field>
    </div>
  );
};
