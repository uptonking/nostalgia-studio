import React, { Fragment, useCallback, useState } from 'react';

import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { useFetchClient } from '@strapi/admin/strapi-admin';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  Flex,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalLayout,
  Typography,
} from '@strapi/design-system';
import { ExclamationMarkCircle } from '@strapi/icons';

import type { Trail } from '../types/trail';
import { buildPayload } from '../utils/build-payload';
import { getTrad } from '../utils/get-trad';
import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';
import { TrailsTable } from './trails-table';
import { VersionDetail } from './version-detail';
import { VersionReview } from './version-review';

type VersionTrailProps = {
  visible?: boolean;
  setVisible: (...args: any[]) => any;
  error?: Record<string, unknown>;
  setError: (...args: any[]) => any;
  page: number;
  setPage: (...args: any[]) => any;
  /** used to trigger parent rerender */
  setLoaded: (...args: any[]) => any;
  total: number;
  pageSize: number;
  pageCount: number;
  collectionType: string;
  model: string;
  trails: Trail[];
  layout: any;
};

export function VersionTrailViewer(props: VersionTrailProps) {
  const {
    visible,
    setVisible,
    trails,
    setError,
    error,
    page,
    pageSize,
    total,
    pageCount,
    setPage,
    setLoaded,
    collectionType,
    layout,
  } = props;

  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const request = useFetchClient();

  const [viewVerDetail, setViewVerDetail] = useState<Trail | null>(null);
  const [changedFields, setChangedFields] = useState<string[]>([]);
  const [showReviewDiff, setShowReviewDiff] = useState(false);

  const handleClose = useCallback(() => {
    setVisible((v) => !v);
    setViewVerDetail(null);
    setChangedFields([]);
    setShowReviewDiff(false);
  }, [setVisible]);

  const handleSetViewVerDetail = useCallback((verDetail) => {
    setChangedFields([]);
    setViewVerDetail(verDetail);
    setShowReviewDiff(false);
  }, []);

  const handleSetChangedFields = useCallback(
    (name, checked) => {
      // if checked, add the name to the array otherwise splice
      if (checked && !changedFields.includes(name)) {
        setChangedFields([...changedFields, name]);
      }

      if (!checked && changedFields.includes(name)) {
        const index = changedFields.indexOf(name);
        const newArr = [...changedFields];
        newArr.splice(index, 1);

        setChangedFields(newArr);
      }
    },
    [changedFields],
  );

  const handleSetShowReviewDiff = useCallback((bool) => {
    setShowReviewDiff(bool);
    if (!bool) {
      setChangedFields([]);
    }
  }, []);

  const handleRestoreVersion = useCallback(async () => {
    // /Gather the final payload
    // TODO: Warning about changing content type/UID dropping trails from the admin panel / killing relationship

    const { documentId, content, contentType } = viewVerDetail!;
    const { trail: trimmedContent } = prepareTrailFromSchema(content, layout);

    const payload = buildPayload(trimmedContent, changedFields);

    try {
      const reqRecordUrl =
        collectionType === 'single-types'
          ? `/content-manager/${collectionType}/${contentType}`
          : `/content-manager/${collectionType}/${contentType}/${documentId}`;
      const result = await request.put(reqRecordUrl, payload);
      // console.log(';; reqRecord ', payload, result);
      handleClose();
      // todo find a better way to reload the page to rerender edit view form
      navigate(0);
      // window.location.reload();
    } catch (reqModelErr) {
      setError(reqModelErr);
      console.error('restore-version:', reqModelErr);
    }
  }, [
    viewVerDetail,
    layout,
    changedFields,
    collectionType,
    request,
    handleClose,
    navigate,
    setError,
  ]);

  return (
    visible && (
      <ModalLayout onClose={handleClose} labelledBy='title'>
        <ModalHeader>
          <Typography
            fontWeight='bold'
            textColor='neutral800'
            as='h2'
            id='title'
          >
            {formatMessage({
              id: getTrad('plugin.admin.versionTrail.revisionHistory'),
              defaultMessage: 'Versions History',
            })}
          </Typography>
        </ModalHeader>
        <ModalBody>
          {!viewVerDetail && (
            <TrailsTable
              trails={trails}
              setViewVerDetail={handleSetViewVerDetail}
              page={page}
              pageSize={pageSize}
              total={total}
              pageCount={pageCount}
              setPage={setPage}
            />
          )}
          {viewVerDetail && !showReviewDiff && (
            <VersionDetail
              trail={viewVerDetail}
              setViewRevision={handleSetViewVerDetail}
              setChangedFields={handleSetChangedFields}
              layout={layout}
            />
          )}
          {viewVerDetail && showReviewDiff && (
            <VersionReview
              trail={viewVerDetail}
              setShowReviewDiff={handleSetShowReviewDiff}
              changedFields={changedFields}
              layout={layout}
            />
          )}
          {error && (
            <Dialog
              onClose={() => setError(null)}
              title={formatMessage({
                id: getTrad('plugin.admin.versionTrail.error'),
                defaultMessage: 'Error',
              })}
              isOpen={Boolean(error)}
            >
              <DialogBody icon={<ExclamationMarkCircle />}>
                <Flex direction='column' alignItems='center' gap={2}>
                  <Flex justifyContent='center'>
                    <Typography>{String(error)}</Typography>
                  </Flex>
                </Flex>
              </DialogBody>
              <DialogFooter
                startAction={
                  <Button onClick={() => setError(null)} variant='tertiary'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.close'),
                      defaultMessage: 'Close',
                    })}
                  </Button>
                }
              />
            </Dialog>
          )}
        </ModalBody>
        <ModalFooter
          endActions={
            <Fragment>
              {!showReviewDiff && changedFields && changedFields.length > 0 && (
                <Button
                  variant='success-light'
                  onClick={() => handleSetShowReviewDiff(true)}
                >
                  {formatMessage({
                    id: getTrad('plugin.admin.versionTrail.review'),
                    defaultMessage: 'Review',
                  })}
                </Button>
              )}
              {showReviewDiff && changedFields && changedFields.length > 0 && (
                <Button variant='danger' onClick={handleRestoreVersion}>
                  {formatMessage({
                    id: getTrad('plugin.admin.versionTrail.restore'),
                    defaultMessage: 'Restore',
                  })}
                </Button>
              )}
              <Button onClick={handleClose} variant='tertiary'>
                {formatMessage({
                  id: getTrad('plugin.admin.versionTrail.close'),
                  defaultMessage: 'Close',
                })}
              </Button>
            </Fragment>
          }
        />
      </ModalLayout>
    )
  );
}
