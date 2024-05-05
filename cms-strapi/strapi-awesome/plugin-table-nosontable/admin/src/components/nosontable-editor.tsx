import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import styled from 'styled-components';

import type Handsontable from '@datalking/nosontable';
import { HotTable } from '@datalking/nosontable-react';
import { Button, Field, FieldLabel, Flex, Stack } from '@strapi/design-system';
import { useField } from '@strapi/strapi/admin';

type NosontableEditorProps = {
  name: string;
  value: string;
  onChange: (...args: any[]) => any;
};

const emptyData = [[]];

export const NosontableEditor = forwardRef<
  Handsontable | null,
  NosontableEditorProps
>(({ onChange, name, value }, ref) => {
  const lastContent = useRef<string>();
  const selection = useRef<{ index: number; length: number } | null>(null);

  const onContentChange = useCallback(() => {
    // console.log(';; on-chg ', ref)
    if (ref && ref['current']) {
      Promise.resolve().then(() => {
        // console.log(
        //   ';; on-txt ',
        //   JSON.stringify(ref['current'].hotInstance.getSourceDataArray()),
        //   // JSON.stringify(ref['current'].getSelection())
        // );
        onChange({
          target: {
            name,
            value: JSON.stringify(
              ref['current'].hotInstance.getSourceDataArray(),
            ),
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
    // console.log(';; ef ', value === JSON.stringify(ref['current'].hotInstance.getSourceDataArray()), value, JSON.stringify(ref['current'].hotInstance.getSourceDataArray()));

    // if (ref && ref['current'] && lastContent.current !== value) {
    if (
      ref &&
      ref['current'] &&
      value !== JSON.stringify(ref['current'].hotInstance.getSourceDataArray())
    ) {
      ref['current'].hotInstance.loadData(
        value ? JSON.parse(value) : emptyData,
      );
      // console.log(';; loadData ')
      // if (selection.current) {
      //   ref['current'].setSelection(
      //     selection.current.index,
      //     selection.current.length,
      //     'silent',
      //   );
      // }
    }

    // lastContent.current = value || '';

    // return () => {
    //   lastContent.current = '';
    // };
  }, [ref, value]);

  const memoedEditor = useMemo(
    () => (
      <StyledTableContainer>
        <HotTable
          data={value ? JSON.parse(value) : emptyData}
          afterChange={onContentChange}
          minRows={40}
          minCols={12}
          minSpareRows={2}
          debug={true}
          colHeaders={true}
          rowHeaders={true}
          columnSorting={true}
          manualColumnMove={true}
          manualColumnResize={true}
          // @ts-expect-error fix-types
          ref={ref}
        />
      </StyledTableContainer>
    ),
    [onContentChange, ref, value],
  );

  return memoedEditor;
});

export const FieldNosontableEditor = ({ name }) => {
  const { onChange, value = '', error } = useField(name);
  // console.log(';; field-tbl ', typeof value, value);

  const hotInstance = useRef<Handsontable | null>(null);

  // const [showMediaLibDialog, setShowMediaLibDialog] = useState(false);
  // const components = useStrapiApp(
  //   'FieldNosontableEditor',
  //   (state) => state.components,
  // );
  // const MediaLibDialog = components['media-library'] as React.ComponentType<{
  //   allowedTypes: Schema.Attribute.MediaKind[];
  //   onClose: () => void;
  //   onSelectAssets: (_images: Schema.Attribute.MediaValue<true>) => void;
  // }>;

  // const handleToggleMediaLibDialog = useCallback(() => {
  //   setShowMediaLibDialog((v) => !v);
  // }, []);

  const handleSelectAssets = (files) => {
    if (!hotInstance.current) return;
    // const formattedImages = files.map((file) => ({
    //   alt: file.alternativeText || file.name,
    //   url: prefixFileUrlWithBackendUrl(file.url),
    //   mime: file.mime,
    // }));
    // const imgDelta = new Delta(
    //   formattedImages.map((img) => ({
    //     insert: { image: img.url },
    //     // attributes:{}
    //   })),
    // );
    // // console.log(';; img ', formattedImages, imgDelta);
    // const existingDelta = quillInstance.current.getContents();
    // const newContentDelta = existingDelta.concat(imgDelta);
    // // @ts-expect-error fix-types
    // onChange({
    //   target: {
    //     name,
    //     value: JSON.stringify(newContentDelta),
    //   },
    // });
    // handleToggleMediaLibDialog();
  };

  return (
    <div>
      <Field name={name}>
        {/* <Button variant='secondary' onClick={handleToggleMediaLibDialog}>
          Insert image from Media Library
        </Button> */}
        <Stack spacing={2} padding={2}>
          <Flex>
            <FieldLabel>{name}</FieldLabel>
          </Flex>
          <NosontableEditor
            name={name}
            onChange={onChange}
            value={value}
            ref={hotInstance}
          />
        </Stack>
        {
          // showMediaLibDialog ? (
          //   <MediaLibDialog
          //     allowedTypes={['images']}
          //     onClose={handleToggleMediaLibDialog}
          //     onSelectAssets={handleSelectAssets}
          //   />
          // ) : null
        }
      </Field>
    </div>
  );
};

export default FieldNosontableEditor;

const StyledTableContainer = styled.div`
  overflow: hidden;
  width: 100%;
  min-height: 35rem;
  max-height: 60rem;
`;
