import API from './api-utils';

type Tags = {
  tags: string[];
};

export function getTags() {
  return API.get<Tags>('/tags');

  // return mockApi.getTags();
}
