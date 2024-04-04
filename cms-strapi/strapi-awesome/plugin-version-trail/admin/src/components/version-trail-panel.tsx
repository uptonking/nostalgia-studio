import React, { Fragment, useCallback, useEffect, useState } from 'react';

import { format, parseISO } from 'date-fns';
import { isEqual } from 'lodash';
import * as qs from 'qs';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import type { Trail } from 'src/types/trail';

import { useFetchClient } from '@strapi/admin/strapi-admin';
import {
  Box,
  Button,
  Divider,
  Loader,
  Typography,
} from '@strapi/design-system';
import { unstable_useDocument } from '@strapi/plugin-content-manager/strapi-admin';

import { useTypedSelector } from '../hooks/use-selector-dispatch';
import { getTrad } from '../utils/get-trad';
import { getUser } from '../utils/get-user';
import { VersionTrailViewer } from './version-trail-viewer';

export function VersionTrailPanel() {
  const { formatMessage } = useIntl();
  const request = useFetchClient();

  // * params works for collection types but not single types
  const {
    id,
    slug: model,
    collectionType,
  } = useParams<{
    id: string;
    slug: string;
    collectionType: string;
  }>();

  const { document: doc, schema: layout } = unstable_useDocument(
    {
      documentId: id === 'create' ? undefined : id,
      model: model!,
      collectionType: collectionType!,
    },
    {
      skip: id === 'create',
    },
  );
  const { uid, pluginOptions = {} } = layout!;
  const [lastData] = useState(doc);

  const [recordId, setRecordId] = useState<string | number | undefined>(
    doc?.id,
  );

  const isVerEnabled = pluginOptions?.versionTrail?.['enabled'];

  // TODO: add this to config/plugins.ts, needs a custom endpoint
  // https://forum.strapi.io/t/custom-field-settings/23068
  const pageSize = useTypedSelector(
    (state) => state['version-trail'].app.versionsList.pageSize,
  );

  // console.log(';; isVer, layout ', isVerEnabled, pageSize, layout, doc);

  const [trails, setTrails] = useState<Trail[]>([]);
  const [currentVer, setCurrentVer] = useState<Trail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [error, setError] = useState<object | boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  /** if collectionType is single then fetch the ID (if exists) from the server
   * and set `1` if nothing.
   */
  const getSingleTypeId = useCallback(async () => {
    const reqSingleUrl = `/content-manager/single-types/${uid}/`;
    try {
      const result = await request.get(reqSingleUrl);
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

  const getTrails = useCallback(
    async (page, pageSize) => {
      // const params = new URLSearchParams({
      //   page,
      //   pageSize,
      //   sort: 'version:desc',
      //   'filters[$and][0][contentType][$eq]': uid,
      //   'filters[$and][1][recordId][$eq]': recordId,
      // } as Record<string, string>).toString();

      const reqParams = qs.stringify(
        {
          filters: {
            $and: [
              {
                contentType: {
                  $eq: uid,
                },
              },
              {
                recordId: {
                  $eq: recordId,
                },
              },
            ],
          },
          sort: ['version:desc'],
          // pagination: {
          page,
          pageSize,
          // },
        },
        {
          encodeValuesOnly: true,
        },
      );

      const reqTrailsUrl = `/content-manager/collection-types/plugin::version-trail.trail?${reqParams}`;
      try {
        const result = await request.get(reqTrailsUrl);
        // console.log(';; reqTrails ', result);
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
    },
    [recordId, request, uid],
  );

  useEffect(() => {
    // /initialize versions data if it is initial load
    if (!loaded && isVerEnabled && recordId) {
      getTrails(page, pageSize);
    } else {
      setInitialLoad(true);
    }
  }, [loaded, uid, recordId, page, isVerEnabled, request, getTrails, pageSize]);

  useEffect(() => {
    // /try to update versions data if it is not initial load
    if (loaded && isVerEnabled && !isEqual(lastData, doc)) {
      getTrails(page, pageSize);
    }
  }, [doc, getTrails, isVerEnabled, lastData, loaded, page, pageSize]);

  const handleSetPage = useCallback((newPage) => {
    setPage(newPage);
    setLoaded(false);
  }, []);

  const toggleVersionsDataModal = useCallback(
    () => setModalVisible((v) => !v),
    [],
  );

  if (!isVerEnabled) {
    return null;
  }

  // TODO: Add diff comparison
  // TODO: Add up/down for changing UIDs and enabling/disabling plugin

  return (
    <Fragment>
      <Box
        aria-labelledby='version-trail-records'
        paddingBottom={4}
        // paddingLeft={4}
        paddingRight={1}
        paddingTop={1}
        borderWidth={0}
      >
        {/* <Typography
          variant='sigma'
          textColor='neutral600'
          id='version-trail-records'
        >
          {formatMessage({
            id: getTrad('plugin.admin.versionTrail.title'),
            defaultMessage: 'Version History',
          })}
        </Typography>
        <Box paddingTop={2} paddingBottom={4}>
          <Divider />
        </Box> */}
        {initialLoad ? (
          <Fragment>
            {total === 0 && (
              <Typography fontWeight='bold'>
                {formatMessage({
                  id: getTrad('plugin.admin.versionTrail.noTrails'),
                  defaultMessage: 'No versions yet',
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
                    {total === 1 ? '1 (Latest)' : total}
                  </Typography>
                </p>
                <p>
                  <Typography variant='pi' fontWeight='bold' color='Neutral600'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.created'),
                      defaultMessage: 'Created At:',
                    })}{' '}
                  </Typography>
                  <Typography variant='pi' color='Neutral600'>
                    {format(parseISO(currentVer.createdAt), 'yyyy-MM-dd HH:mm')}
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
                {total > 1 ? (
                  <Box paddingTop={4}>
                    <Button onClick={toggleVersionsDataModal}>
                      {formatMessage({
                        id: getTrad('plugin.admin.versionTrail.viewAll'),
                        defaultMessage: 'View all',
                      })}
                    </Button>
                  </Box>
                ) : null}
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
        setLoaded={setLoaded}
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
