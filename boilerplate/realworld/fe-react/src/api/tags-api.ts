import API from './api-utils';
import mockApi from './mock-api';

type Tags = {
  tags: string[];
};

export function getTags() {
  // return API.get<Tags>('/tags');

  return mockApi.getTags();
}
