import 'react-quill/dist/quill.snow.css';

import React, { forwardRef, useEffect, useRef, useState } from 'react';

import Quill from 'quill';

import { Button, Field, FieldLabel, Flex, Stack } from '@strapi/design-system';
import { type InputProps, useField } from '@strapi/strapi/admin';

// import { useLibrary, prefixFileUrlWithBackendUrl } from '@strapi/helper-plugin';

type QuillEditorProps = {
  onChange: (...args: any[]) => any;
  name: string;
  value: string;
};

export const QuillEditor = forwardRef<Quill, QuillEditorProps>(
  ({ onChange, name, value }, ref) => {
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

    const containerRef = useRef<HTMLDivElement>(null);
    // const onTextChangeRef = useRef(onTextChange);
    // const onSelectionChangeRef = useRef(onSelectionChange);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const editorContainer = container.appendChild(
        container.ownerDocument.createElement('div'),
      );
      const quill = new Quill(editorContainer, {
        modules,
        theme: 'snow',
      });
      if (!ref) {
        // @ts-expect-error fix-types
        ref = {};
      }
      // @ts-expect-error fix-types
      ref.current = quill;

      if (value) {
        quill.setContents(JSON.parse(value));
      }

      quill.on(Quill.events.TEXT_CHANGE, (...args) => {
        // onTextChangeRef.current?.(...args);
        onChange({
          target: { name, value: JSON.stringify(quill.getContents()) },
        });
      });
      // quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
      //   onSelectionChangeRef.current?.(...args);
      // });
      // let vv = name;
      return () => {
        // @ts-expect-error fix-types
        ref.current = null;
        container.innerHTML = '';
      };
    }, [name, ref]);

    return <div ref={containerRef} />;
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
