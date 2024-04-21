import 'quill/styles/quill.snow.css';
import '@datalking/noseditor/src/styles.scss';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Quill from 'quill';

import { NoseditorFull } from '@datalking/noseditor-react';
import { useStrapiApp } from '@strapi/admin/strapi-admin';
import { Button, Field, FieldLabel, Flex, Stack } from '@strapi/design-system';
import { useField } from '@strapi/strapi/admin';
import type { Schema } from '@strapi/types';

import { prefixFileUrlWithBackendUrl } from '../utils/image';

const Delta = Quill.import('delta');

type QuillEditorProps = {
  name: string;
  value: string;
  onChange: (...args: any[]) => any;
};

export const QuillEditor = forwardRef<Quill | null, QuillEditorProps>(
  ({ onChange, name, value }, ref) => {
    const lastContent = useRef<string>();
    const selection = useRef<{ index: number; length: number } | null>(null);

    const onContentChange = useCallback(() => {
      // console.log(';; on-chg ', ref)
      if (ref && ref['current']) {
        Promise.resolve().then(() => {
          selection.current = ref['current'].getSelection();
          // console.log(';; txt-sel ', selection.current);
          // console.log(
          //   ';; on-txt ',
          //   JSON.stringify(ref['current'].getContents()),
          //   JSON.stringify(ref['current'].getSelection())
          // );
          onChange({
            target: {
              name,
              value: JSON.stringify(ref['current'].getContents()),
            },
          });
        });
      }
    }, [name, onChange, ref]);

    // const onSelectChange = useCallback((range, old) => {
    //   selection.current = range;
    //   console.log(';; on-sel ', range, old);
    // }, []);

    useEffect(() => {
      if (ref && ref['current'] && lastContent.current !== value) {
        ref['current'].setContents(value ? JSON.parse(value) : '');
        if (selection.current) {
          ref['current'].setSelection(
            selection.current.index,
            selection.current.length,
            'silent',
          );
        }
      }

      lastContent.current = value || '';
      // return () => {
      //   lastContent.current = '';
      // }
    }, [ref, value]);

    // console.log(';; ql ', name, value);

    const memoedEditor = useMemo(
      () => (
        <NoseditorFull
          onChange={onContentChange}
          // onSelectionChange={onSelectChange}
          // initialContent={value ? JSON.parse(value) : ''}
          ref={ref}
        />
      ),
      [onContentChange, ref],
    );

    return memoedEditor;
    // return (
    //   <NoseditorFull
    //     onChange={onContentChange}
    //     // initialContent={value ? JSON.parse(value) : ''}
    //     ref={ref}
    //   />
    // )
  },
);

export const FieldQuillEditor = ({ name }) => {
  const { onChange, value = '', error } = useField(name);
  // console.log(';; field-edi ', typeof value, value);

  const quillInstance = useRef<Quill | null>(null);

  const [showMediaLibDialog, setShowMediaLibDialog] = useState(false);
  const components = useStrapiApp(
    'FieldQuillEditor',
    (state) => state.components,
  );
  const MediaLibDialog = components['media-library'] as React.ComponentType<{
    allowedTypes: Schema.Attribute.MediaKind[];
    onClose: () => void;
    onSelectAssets: (_images: Schema.Attribute.MediaValue<true>) => void;
  }>;

  const handleToggleMediaLibDialog = useCallback(() => {
    setShowMediaLibDialog((v) => !v);
  }, []);

  const handleSelectAssets = (files) => {
    if (!quillInstance.current) return;
    const formattedImages = files.map((file) => ({
      alt: file.alternativeText || file.name,
      url: prefixFileUrlWithBackendUrl(file.url),
      mime: file.mime,
    }));
    // const images = formattedImages.map(image => `<image src='${image.url}' alt='${image.alt}'>`).join();
    const imgDelta = new Delta(
      formattedImages.map((img) => ({
        insert: { image: img.url },
        // attributes:{}
      })),
    );
    // console.log(';; img ', formattedImages, imgDelta);
    const existingDelta = quillInstance.current.getContents();
    const newContentDelta = existingDelta.concat(imgDelta);
    // @ts-expect-error fix-types
    onChange({
      target: {
        name,
        value: JSON.stringify(newContentDelta),
      },
    });
    handleToggleMediaLibDialog();
  };

  return (
    <div>
      <Field name={name}>
        <Button variant='secondary' onClick={handleToggleMediaLibDialog}>
          Insert image from Media Library
        </Button>
        <Stack spacing={2} padding={2}>
          <Flex>
            <FieldLabel>{name}</FieldLabel>
          </Flex>
          <QuillEditor
            name={name}
            onChange={onChange}
            value={value}
            ref={quillInstance}
          />
        </Stack>
        {showMediaLibDialog ? (
          <MediaLibDialog
            allowedTypes={['images']}
            onClose={handleToggleMediaLibDialog}
            onSelectAssets={handleSelectAssets}
          />
        ) : null}
      </Field>
    </div>
  );
};

export default FieldQuillEditor;
