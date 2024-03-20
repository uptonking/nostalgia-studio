/*
 *
 * HomePage
 *
 */

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import upperFirst from 'lodash/upperFirst';

import { Button } from '@strapi/design-system/Button';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import {
  BaseHeaderLayout,
  ContentLayout,
  HeaderLayout,
  Layout,
} from '@strapi/design-system/Layout';
import { Stack } from '@strapi/design-system/Stack';
import { LoadingIndicatorPage } from '@strapi/helper-plugin';
import Plus from '@strapi/icons/Plus';

import { customApiRequest } from '../../api/custom-api';
import { CustomAPITable } from '../../components/custom-apis-table';
import { IconsSvg } from '../../components/icons-svg';
import { CustomAPICustomizationPage } from '../custom-api-working-page';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [customAPIData, setCustomAPIData] = useState([]);
  const [contentTypeCount, setContentTypeCount] = useState(0);

  const [showCustomAPICustomizationPage, setShowCustomAPICustomizationPage] =
    useState(false);

  const fetchData = async () => {
    if (isLoading === false) setIsLoading(true);
    const customApiData = await customApiRequest.getAllCustomApis();
    setCustomAPIData(customApiData);

    const contentTypeData = await customApiRequest.getAllContentTypes();
    setContentTypeCount(contentTypeData.length);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function deleteCustomAPI() {
    alert('Add functionality to delete the API');
  }

  async function editCustomAPI(id) {
    setShowCustomAPICustomizationPage({ id: id });
  }

  {
    if (isLoading) {
      return <LoadingIndicatorPage />;
    }
  }

  return (
    <Layout>
      <BaseHeaderLayout
        title='Custom API Builder Plugin'
        subtitle='Visually build a custom API endpoint for any content type with fields nested any level deep'
        as='h2'
      />

      <ContentLayout>
        {customAPIData.length === 0 && !showCustomAPICustomizationPage && (
          <div>
            <EmptyStateLayout
              icon={<IconsSvg />}
              content={
                !!!contentTypeCount
                  ? 'You require at least 1 collection type to proceed, Content-Type builder -> Create new collection type'
                  : "You don't have any custom API yet"
              }
              action={
                <Button
                  onClick={() =>
                    setShowCustomAPICustomizationPage({ id: null })
                  }
                  variant='secondary'
                  startIcon={<Plus />}
                  disabled={!!!contentTypeCount}
                >
                  Add your first Custom API
                </Button>
              }
            />
          </div>
        )}

        {customAPIData.length > 0 && !showCustomAPICustomizationPage && (
          <>
            <HeaderLayout
              id='title'
              primaryAction={
                <Stack horizontal spacing={2}>
                  <Button
                    startIcon={<Plus />}
                    onClick={() => {
                      setShowCustomAPICustomizationPage({ id: null });
                    }}
                    type='submit'
                    disabled={false}
                  >
                    Create new custom API
                  </Button>
                </Stack>
              }
              title={upperFirst(
                `custom  API${customAPIData.length > 1 ? 's' : ''}`,
              )}
              subtitle={`${customAPIData.length} ${
                customAPIData.length > 1 ? 'entries' : 'entry'
              } found`}
            />
            <ContentLayout>
              <CustomAPITable
                customAPIData={customAPIData}
                setShowCustomAPICustomizationPage={
                  setShowCustomAPICustomizationPage
                }
                deleteCustomAPI={deleteCustomAPI}
                editCustomAPI={editCustomAPI}
              />
            </ContentLayout>
          </>
        )}

        {showCustomAPICustomizationPage && (
          <CustomAPICustomizationPage
            showCustomAPICustomizationPage={showCustomAPICustomizationPage}
            setShowCustomAPICustomizationPage={
              setShowCustomAPICustomizationPage
            }
            isLoading={isLoading}
            fetchData={fetchData}
          />
        )}
      </ContentLayout>
    </Layout>
  );
};

export default memo(HomePage);
