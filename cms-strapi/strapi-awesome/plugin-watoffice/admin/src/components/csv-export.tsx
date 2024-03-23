import React, { useState } from 'react';

import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Button } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../pluginId';
import { downloadFile } from '../utils/download';

export const ExportCSVButton = ({ strapi }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { get: ajax } = useFetchClient();

  const { slug: contentTypeUID } = useParams();
  // const contentTypeUID = useSelector((state) =>
  //   get(state, ['content-manager_listView', 'contentType', 'uid'], null),
  // );

  const handleClick = async () => {
    setIsLoading(true);
    const {
      data: { data },
    } = await ajax(`/${PLUGIN_ID}/${contentTypeUID}`);
    downloadFile(contentTypeUID, data, 'text/csv');
    setIsLoading(false);
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} loading={isLoading}>
      Export
    </Button>
  );
};
