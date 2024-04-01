import React, { useCallback, useEffect, useState } from 'react';

import { format, parseISO } from 'date-fns';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  unstable_useDocument,
  unstable_useDocumentLayout,
} from '@strapi/admin/strapi-admin';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogFooter,
  Divider,
  Flex,
  Option,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';

import { getTrad } from '../utils';

// import { TableLabel } from "@strapi/design-system/Text";
// import { useCMEditViewDataManager } from '@strapi/helper-plugin';

/** version info card for content entry */
export const Versions = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    id,
    slug: model,
    collectionType,
  } = useParams<{
    id: string;
    slug: string;
    collectionType: string;
  }>();

  // const {
  //   initialData,
  //   modifiedData,
  //   // isCreatingEntry,
  //   // slug,
  //   // hasDraftAndPublish,
  //   // layout,
  //   // isDuplicatingEntry,
  //   // onChange,
  // } = useCMEditViewDataManager();

  const hasDraftAndPublish = true;
  const modifiedData: any = useSelector(
    (state: any) =>
      state['content-type-builder_dataManagerProvider']?.['modifiedData'] || {},
  );
  const initialData: any = useSelector(
    (state: any) => state['content-manager_app'] || {},
  );

  const { document } = unstable_useDocument({
    documentId: id,
    model: model!,
    collectionType: collectionType!,
  });

  const isCreatingEntry = id === 'create';

  const {
    edit: { layout },
  } = unstable_useDocumentLayout(model!);

  // console.log(';; ver-doc ', id, model, collectionType, document);

  const { put } = useFetchClient();

  // const [hasComment, setHasComment] = useState(!!initialData?.versionComment);
  const [data, setData] = useState([]);
  const [publishedVersion, setPublishedVersion] = useState<
    { versionNumber: string; publishedAt: string } | undefined
  >(undefined);

  // useEffect(() => {
  //   setHasComment(!!initialData?.versionComment?.length);
  // }, [initialData]);

  const processVersions = useCallback(
    (data) => {
      const versions = (data.versions || []).map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        label: `v${v.versionNumber}`,
        publishedAt: v.publishedAt,
        createdAt: v.createdAt,
      }));
      const sortedVersions = [...versions].sort(
        (a, b) => b.versionNumber - a.versionNumber,
      );
      setData(sortedVersions as any);

      if (hasDraftAndPublish) {
        const publishedVersions = versions.filter((v) => v.publishedAt);
        if (data.publishedAt) {
          publishedVersions.push({
            versionNumber: data.versionNumber,
            publishedAt: data.publishedAt,
          });
        }
        const publishedVersion = _.maxBy(
          publishedVersions,
          // @ts-expect-error fix-types
          (v) => v.versionNumber,
        );

        setPublishedVersion(publishedVersion as any);
      }
    },
    [hasDraftAndPublish, setData, setPublishedVersion],
  );

  // useEffect(() => {
  //   processVersions(modifiedData);
  // }, [modifiedData, processVersions]);

  useEffect(() => {
    if (modifiedData.id) {
      const UrlSegments = location.pathname.split('/');
      const urlId = parseInt(UrlSegments[UrlSegments.length - 1], 10);

      // navigate
      // // if (modifiedData.id !== urlId) {
      // //   replace({
      // //     search: location.search,
      // //     pathname: `/content-manager/collectionType/${slug}/${modifiedData.id}`,
      // //   });
      // }
    }
  }, [location.pathname, modifiedData.id]);

  const handleChange = useCallback((value) => {
    // if (!value) {
    //   return;
    // }
    // // fixed bug when version being iterated was not the same type as the version being selected (string != number)
    // const selectedVersion = data.find(
    //   // @ts-expect-error fix-types
    //   (v) => v.versionNumber === Number(value),
    // );
    // push({
    //   search: location.search,
    //   // @ts-expect-error fix-types
    //   pathname: `/content-manager/collectionType/${slug}/${selectedVersion.id}`,
    // });
  }, []);

  const handleUpdateShowedVersion = () => {
    put(
      `/version-history/${model}/${initialData.id}/update-version`,
      modifiedData,
    );
  };

  if (!model || !collectionType) return null;

  // layout?.[0]?.[0]?.['attribute']?.['pluginOptions']?.['versions']?.['versioned']
  // if (!_.get(layout, 'pluginOptions.versions.versioned', false)) {
  const isVersionedDoc =
    layout?.[0]?.[0]?.[0]?.['attribute']?.['pluginOptions']?.['versions']?.[
      'versioned'
    ];

  // console.log(';; isVersionedDoc', isVersionedDoc, layout)

  if (!isVersionedDoc) {
    return null;
  }

  return (
    <Box
      as='aside'
      aria-labelledby='versioning-informations'
      background='neutral0'
      borderColor='neutral150'
      hasRadius
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={6}
      shadow='tableShadow'
    >
      <Typography
        variant='sigma'
        textColor='neutral600'
        id='versioning-informations'
      >
        {formatMessage({
          id: getTrad('components.Edit.versions'),
          defaultMessage: 'Versions',
        })}
      </Typography>
      <Box paddingTop={2} paddingBottom={6}>
        <Divider />
      </Box>

      <Stack size={4}>
        {publishedVersion && (
          <div>
            <Typography fontWeight='bold'>
              {formatMessage({
                id: getTrad('containers.Edit.currentPublishedVersion'),
                defaultMessage: 'Published version',
              })}
            </Typography>
            <div>
              <Typography variant='pi'>{`v${publishedVersion.versionNumber}`}</Typography>{' '}
              <Typography variant='pi' color='Neutral600'>
                {format(
                  parseISO(publishedVersion.publishedAt),
                  'MMM d, yyyy HH:mm',
                )}
              </Typography>
            </div>
          </div>
        )}
        {!isCreatingEntry && (
          <div style={{ marginBottom: 20 }}>
            <Typography fontWeight='bold'>
              {formatMessage({
                id: getTrad('containers.Edit.currentShowedVersion'),
                defaultMessage: 'Currently shown version',
              })}
            </Typography>
            <div>
              {/* <Typography variant='pi'>v{initialData.versionNumber}</Typography>{' '} */}
              <Typography variant='pi'>
                v{document?.versionNumber || 1}
              </Typography>{' '}
              <Typography variant='pi' textColor='neutral600'>
                {/* {format(parseISO(initialData.createdAt), 'MMM d, yyyy HH:mm')} */}
              </Typography>
            </div>
            <Button marginTop={4} onClick={handleUpdateShowedVersion}>
              {formatMessage({
                id: getTrad('containers.Edit.updateShowedVersion'),
                defaultMessage: 'Update showed version',
              })}
            </Button>
          </div>
        )}
        {/* {!isDuplicatingEntry && data.length > 0 && (
          <Select
            name={'version-select'}
            placeholder={formatMessage({
              id: getTrad('components.Edit.versionSelectPlaceholder'),
              defaultMessage: 'Select version',
            })}
            label={formatMessage({
              id: getTrad('components.Edit.versionChangeVersion'),
              defaultMessage: 'Change to version',
            })}
            onChange={handleChange}
          >
            {data.map((option) => {
              return (
                <Option
                  key={option.versionNumber}
                  value={option.versionNumber}
                  startIcon={
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '50%',
                        width: '6px',
                        background: option.publishedAt
                          ? 'rgb(50, 128, 72)'
                          : 'rgb(12, 117, 175)',
                      }}
                    />
                  }
                >
                  {`${option.label} ${format(
                    parseISO(option.createdAt),
                    'MMM d, yyyy HH:mm',
                  )}`}
                </Option>
              );
            })}
          </Select>
        )} */}

        {/* <Checkbox
          onValueChange={(value) => {
            setHasComment(value);
            if (!value) {
              onChange({
                target: {
                  name: 'versionComment',
                  value: undefined,
                  type: 'textarea',
                },
              });
            }
          }}
          value={hasComment}
          type='checkbox'
        >
          {formatMessage({
            id: getTrad('containers.Edit.toggleComment'),
            defaultMessage: 'Save new version',
          })}
        </Checkbox>
        {hasComment && (
          <Textarea
            name='versionComment'
            onChange={(comment) => {
              onChange({
                target: {
                  name: 'versionComment',
                  value: comment.target.value,
                  type: 'textarea',
                },
              });
            }}
          >
            {modifiedData?.versionComment}
          </Textarea>
        )} */}
      </Stack>
    </Box>
  );
};
