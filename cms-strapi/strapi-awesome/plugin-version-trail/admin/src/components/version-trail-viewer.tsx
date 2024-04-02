import React, { Fragment, useCallback, useState } from 'react';

import { useIntl } from 'react-intl';

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
import {
  unstable_useDocumentLayout,
  useFetchClient,
} from '@strapi/strapi/admin';

import type { Trail } from '../types/trail';
import { buildPayload } from '../utils/build-payload';
import { getTrad } from '../utils/get-trad';
import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';
import { TrailsTable } from './trails-table';
import { VersionRestoreView } from './version-restore-view';
import { VersionReview } from './version-review';

type VersionTrailProps = {
  visible?: boolean;
  setVisible: (...args: any[]) => any;
  error?: Record<string, unknown>;
  setError: (...args: any[]) => any;
  page: number;
  setPage: (...args: any[]) => any;
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
    model,
    trails,
    setError,
    error,
    page,
    pageSize,
    total,
    pageCount,
    setPage,
    collectionType,
    layout,
  } = props;

  const { formatMessage } = useIntl();
  const request = useFetchClient();

  const [viewRevision, setViewRevision] = useState<Trail | null>(null);
  const [revisedFields, setRevisedFields] = useState<string[]>([]);
  const [showReviewStep, setShowReviewStep] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(!visible);
    setViewRevision(null);
    setRevisedFields([]);
    setShowReviewStep(false);
  }, [visible, setVisible]);

  const handleSetViewRevision = useCallback((viewRevisionState) => {
    setRevisedFields([]);
    setViewRevision(viewRevisionState);
    setShowReviewStep(false);
  }, []);

  const handleSetRevisedFields = useCallback(
    (name, checked) => {
      /**
       * if checked, add the name to the array otherwise splice
       */
      if (checked && !revisedFields.includes(name)) {
        setRevisedFields([...revisedFields, name]);
      }

      if (!checked && revisedFields.includes(name)) {
        const index = revisedFields.indexOf(name);
        const newArr = [...revisedFields];
        newArr.splice(index, 1);

        setRevisedFields(newArr);
      }
    },
    [revisedFields],
  );

  const handleSetShowReviewStep = useCallback((bool) => {
    setShowReviewStep(bool);
    if (!bool) {
      setRevisedFields([]);
    }
  }, []);

  // const { layout } = useCMEditViewDataManager();
  // const { edit: { layout } } = unstable_useDocumentLayout(model!);
  // log null false
  // console.log(';; ver-viewer ', viewRevision, showReviewStep);

  const handleRestoreSubmission = useCallback(async () => {
    /**
     * Gather the final payload
     */

    // TODO: Warning about changing content type/UID dropping trails from the admin panel / killing relationship

    const { recordId, content, contentType } = viewRevision!;

    const { trail: trimmedContent } = prepareTrailFromSchema(content, layout);

    const payload = buildPayload(trimmedContent, revisedFields);

    try {
      const reqRecordUrl =
        collectionType === 'single-types'
          ? `/content-manager/${collectionType}/${contentType}`
          : `/content-manager/${collectionType}/${contentType}/${recordId}`;
      const result = await request.put(reqRecordUrl, payload);
      console.log(';; reqRecord ', result);

      // fixme reload
      window.location.reload();
    } catch (reqModelErr) {
      setError(reqModelErr);
      console.error('version-trail:', reqModelErr);
    }
  }, [layout, viewRevision, revisedFields, request, setError, collectionType]);

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
              defaultMessage: 'Revision History',
            })}
          </Typography>
        </ModalHeader>
        <ModalBody>
          {!viewRevision && (
            <TrailsTable
              trails={trails}
              setViewRevision={handleSetViewRevision}
              page={page}
              pageSize={pageSize}
              total={total}
              pageCount={pageCount}
              setPage={setPage}
            />
          )}
          {viewRevision && !showReviewStep && (
            <VersionRestoreView
              trail={viewRevision}
              setViewRevision={handleSetViewRevision}
              setRevisedFields={handleSetRevisedFields}
              layout={layout}
            />
          )}
          {viewRevision && showReviewStep && (
            <VersionReview
              trail={viewRevision}
              setShowReviewStep={handleSetShowReviewStep}
              revisedFields={revisedFields}
              layout={layout}
            />
          )}
          {/* error alert */}
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
              {!showReviewStep && revisedFields && revisedFields.length > 0 && (
                <Button
                  variant='success-light'
                  onClick={() => handleSetShowReviewStep(true)}
                >
                  {formatMessage({
                    id: getTrad('plugin.admin.versionTrail.review'),
                    defaultMessage: 'Review',
                  })}
                </Button>
              )}
              {showReviewStep && revisedFields && revisedFields.length > 0 && (
                <Button
                  variant='danger'
                  onClick={() => handleRestoreSubmission()}
                >
                  {formatMessage({
                    id: getTrad('plugin.admin.versionTrail.restore'),
                    defaultMessage: 'Restore',
                  })}
                </Button>
              )}
              <Button onClick={() => handleClose()} variant='tertiary'>
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
