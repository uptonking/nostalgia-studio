import React, { Fragment, useCallback, useEffect, useState } from 'react';

import { format, parseISO } from 'date-fns';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import {
  Box,
  Button,
  Divider,
  Loader,
  Typography,
} from '@strapi/design-system';
import {
  unstable_useDocument,
  unstable_useDocumentLayout,
  useFetchClient,
} from '@strapi/strapi/admin';

import { getTrad } from '../utils/get-trad';
import { getUser } from '../utils/get-user';
import { VersionTrailViewer } from './version-trail-viewer';

export function VersionTrailPanel() {
  const { formatMessage } = useIntl();

  // params works for collection types but not single types
  const {
    id,
    slug: model,
    collectionType,
  } = useParams<{
    id: string;
    slug: string;
    collectionType: string;
  }>();

  const { document: doc, schema: layout } = unstable_useDocument({
    documentId: id,
    model: model!,
    collectionType: collectionType!,
  });
  const { uid, pluginOptions = {} } = layout!;

  const [recordId, setRecordId] = useState(id);

  const isVerEnabled = pluginOptions?.versionTrail?.['enabled'];

  console.log(';; isVer, layout ', isVerEnabled, layout, doc);
  // TODO: add this to config/plugins.ts, needs a custom endpoint
  // https://forum.strapi.io/t/custom-field-settings/23068
  const pageSize = 15;

  const request = useFetchClient();

  const [trails, setTrails] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [currentVer, setCurrentVer] = useState<object | null>(null);
  const [error, setError] = useState<object | boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // if collectionType is single then fetch the ID (if exists) from the server and set `1` if nothing.

  const getSingleTypeId = useCallback(async () => {
    const requestUri = `/content-manager/single-types/${uid}/`;
    try {
      const result = await request.get(requestUri);

      const { data = {} } = result;

      const { id } = data;

      setRecordId(id);

      return id;
    } catch (err) {
      console.error(
        'version-trail:',
        'No existing single type for this UID',
        err,
      );
    }

    return null;
  }, [uid, request]);

  useEffect(() => {
    if (collectionType === 'single-types') {
      getSingleTypeId();
    }
  }, [collectionType, getSingleTypeId]);

  useEffect(() => {
    async function getTrails(page, pageSize) {
      const params = new URLSearchParams({
        page,
        pageSize,
        sort: 'version:DESC',
        'filters[$and][0][contentType][$eq]': uid,
        'filters[$and][1][recordId][$eq]': recordId,
      } as Record<string, string>).toString();

      const reqTrailsUrl = `/content-manager/collection-types/plugin::version-trail.trail?${params}`;

      try {
        const result = await request.get(reqTrailsUrl);

        const { data = {} } = result;

        const { results = [], pagination } = data;

        const { total, pageCount } = pagination;

        setTotal(total);
        setPageCount(pageCount);
        setTrails(results);

        if (page === 1 && total > 0) {
          setCurrentVer(results[0]);
        }

        setLoaded(true);
        setInitialLoad(true);
      } catch (reqTrailsErr) {
        console.error('version-trail: ', reqTrailsErr);
        setError(reqTrailsErr as object);
      }
    }

    if (!loaded && isVerEnabled && recordId) {
      getTrails(page, pageSize);
    } else {
      setInitialLoad(true);
    }
  }, [loaded, uid, recordId, page, isVerEnabled, request]);

  /**
   * event listener for submit button
   */
  const handler = useCallback(async () => {
    setTimeout(async () => {
      if (collectionType === 'single-types') {
        await getSingleTypeId();
      }
      setPage(1);
      setLoaded(false);
      setInitialLoad(false);
    }, 1000);
  }, [getSingleTypeId, collectionType]);

  const handleSetPage = useCallback((newPage) => {
    setPage(newPage);
    setLoaded(false);
  }, []);

  /**
   * TODO: this event listener is not working properly 100% of the time needs a better solution
   */
  useEffect(() => {
    const buttons = window.document.querySelectorAll(
      'main button[type=submit]',
    );
    if (buttons[0]) {
      const button = buttons[0];

      button.addEventListener('click', handler);

      return () => {
        button.removeEventListener('click', handler);
      };
    }
  }, [handler]);

  if (!isVerEnabled) {
    return <Fragment />;
  }

  // TODO: Add diff comparison
  // TODO: Add up/down for changing UIDs and enabling/disabling plugin

  return (
    <Fragment>
      <Box
        as='aside'
        aria-labelledby='version-trail-records'
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
          id='version-trail-records'
        >
          {formatMessage({
            id: getTrad('plugin.admin.versionTrail.title'),
            defaultMessage: 'Version Trail',
          })}
        </Typography>
        <Box paddingTop={2} paddingBottom={4}>
          <Divider />
        </Box>
        {initialLoad ? (
          <Fragment>
            {total === 0 && (
              <Typography fontWeight='bold'>
                {formatMessage({
                  id: getTrad('plugin.admin.versionTrail.noTrails'),
                  defaultMessage: 'No versions (yet)',
                })}
              </Typography>
            )}
            {total > 0 && currentVer && (
              <Fragment>
                <p>
                  <Typography fontWeight='bold'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.currentVersion'),
                      defaultMessage: 'Current version:',
                    })}{' '}
                    {total}
                  </Typography>
                </p>
                <p>
                  <Typography variant='pi' fontWeight='bold' color='Neutral600'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.created'),
                      defaultMessage: 'Created:',
                    })}{' '}
                  </Typography>
                  <Typography variant='pi' color='Neutral600'>
                    {format(
                      parseISO(currentVer['createdAt']),
                      'MMM d, yyyy HH:mm',
                    )}
                  </Typography>
                </p>
                <p>
                  <Typography variant='pi' fontWeight='bold' color='Neutral600'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.createdBy'),
                      defaultMessage: 'Created by:',
                    })}{' '}
                  </Typography>
                  <Typography variant='pi' color='Neutral600'>
                    {getUser(currentVer)}
                  </Typography>
                </p>
                <Box paddingTop={4}>
                  <Button onClick={() => setModalVisible(!modalVisible)}>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.viewAll'),
                      defaultMessage: 'View all',
                    })}
                  </Button>
                </Box>
              </Fragment>
            )}
          </Fragment>
        ) : (
          <Loader />
        )}
      </Box>
      <VersionTrailViewer
        visible={modalVisible}
        setVisible={setModalVisible}
        model={model!}
        trails={trails}
        error={error as Record<string, unknown>}
        setError={setError}
        page={page}
        pageSize={pageSize}
        pageCount={pageCount}
        total={total}
        setPage={handleSetPage}
        collectionType={collectionType!}
        layout={layout}
      />
    </Fragment>
  );
}
