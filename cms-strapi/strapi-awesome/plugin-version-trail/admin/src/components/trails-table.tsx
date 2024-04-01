import React, { Fragment } from 'react';

import { format, parseISO } from 'date-fns';
import { useIntl } from 'react-intl';

import {
  Box,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden,
} from '@strapi/design-system';
import { Eye } from '@strapi/icons';

import type { Trail } from '../types/trail';
import { getTrad } from '../utils/get-trad';
import { getUser } from '../utils/get-user';
import { TrailsTablePagination } from './trails-table-pagination';

type TrailTableProps = {
  setViewRevision: (...args: any[]) => any;
  page: number;
  total: number;
  pageSize: number;
  pageCount: number;
  setPage: (...args: any[]) => any;
  trails: Array<Trail>;
};

export function TrailsTable(props: TrailTableProps) {
  const { trails, setViewRevision, page, pageSize, total, pageCount, setPage } =
    props;

  const { formatMessage } = useIntl();

  return (
    <Fragment>
      {trails && trails.length > 0 && (
        <Fragment>
          <Box paddingBottom={4}>
            <TrailsTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              pageCount={pageCount}
              setPage={setPage}
            />
          </Box>
          <Table colCount={4} rowCount={trails.length}>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant='sigma'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.version'),
                      defaultMessage: 'Version',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant='sigma'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.changeType'),
                      defaultMessage: 'Change Type',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant='sigma'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.createdNaked'),
                      defaultMessage: 'Created',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant='sigma'>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.createdByNaked'),
                      defaultMessage: 'Created By',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <VisuallyHidden>
                    {formatMessage({
                      id: getTrad('plugin.admin.versionTrail.actions'),
                      defaultMessage: 'Actions',
                    })}
                  </VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {trails.map((trail) => (
                <Tr key={trail.id}>
                  <Td>
                    <Typography textColor='neutral800'>
                      {trail.version}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography textColor='neutral800'>
                      {trail.change}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography textColor='neutral800'>
                      {format(parseISO(trail.createdAt), 'MMM d, yyyy HH:mm')}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography textColor='neutral800'>
                      {getUser(trail)}
                    </Typography>
                  </Td>
                  <Td>
                    <Flex>
                      <IconButton
                        onClick={() => setViewRevision(trail)}
                        label={`${formatMessage({
                          id: getTrad('plugin.admin.versionTrail.viewVersion'),
                          defaultMessage: 'View version',
                        })} ${trail.version}`}
                        noBorder
                        icon={<Eye />}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Box paddingTop={4}>
            <TrailsTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              pageCount={pageCount}
              setPage={setPage}
            />
          </Box>
        </Fragment>
      )}
      {!trails ||
        (trails.length === 0 && (
          <Typography variant='beta'>
            {formatMessage({
              id: getTrad('plugin.admin.versionTrail.noTrails'),
              defaultMessage: 'Close',
            })}
          </Typography>
        ))}
    </Fragment>
  );
}
