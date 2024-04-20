import 'quill/styles/quill.snow.css';
import '@datalking/noseditor/src/styles.scss';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type Quill from 'quill';

import { NoseditorFull } from '@datalking/noseditor-react';
import { Button, Field, FieldLabel, Flex, Stack } from '@strapi/design-system';
import { type InputProps, useField } from '@strapi/strapi/admin';

// import { useLibrary, prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';

type QuillEditorProps = {
  name: string;
  value: string;
  onChange: (...args: any[]) => any;
};

export const QuillEditor = forwardRef<Quill, QuillEditorProps>(
  ({ onChange, name, value }, ref) => {
    const onContentChange = useCallback(() => {
      console.log(';; ref ', ref);
      if (ref && ref['current']) {
        onChange({
          // @ts-expect-error fix-types
          target: { name, value: JSON.stringify(ref.current.getContents()) },
        });
      }
    }, [name, onChange, ref]);

    console.log(';; ql ', name, value);
    return (
      <NoseditorFull
        onChange={onContentChange}
        initialContent={value ? JSON.parse(value) : ' '}
        ref={ref}
      />
    );
  },
);

export const FieldQuillEditor = ({ name }) => {
  const { onChange, value = '', error } = useField(name);

  const quillRef = useRef<Quill | null>(null);

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
        {/* <Button variant='secondary' onClick={handleToggleMediaLibDialog}>
          MediaLib
        </Button> */}
        <Stack spacing={2} padding={2}>
          <Flex>
            <FieldLabel>{name}</FieldLabel>
          </Flex>
          <QuillEditor
            name={name}
            onChange={onChange}
            value={value}
            ref={quillRef}
          />
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

export default FieldQuillEditor;
