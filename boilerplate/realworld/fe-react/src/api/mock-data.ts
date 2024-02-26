import { faker } from '@faker-js/faker';

const userNum = 3;
const articleNum = 6;

export const userList = new Array(userNum).fill(0).map((item, index) => ({
  id: index,
  username: `testuser${index}`,
  email: `testuser${index}@gmail.com`,
  token: `jwt-token-${index}`,
  bio: faker.person.jobTitle(),
  image: faker.image.avatar(),
}));

export function getUserByUsername(username) {
  return userList.find((user) => user.username === username);
}

export const articleList = new Array(articleNum).fill(0).map((item, index) => {
  const articleContent = faker.lorem.paragraphs();

  return {
    // slug: `article-id-${index}`,
    slug: faker.lorem.slug(),
    title: `${index}-${faker.lorem.words()}`,
    description: `${articleContent.slice(0, 96)}...`,
    body: articleContent,
    tagList: [faker.person.jobType(), faker.person.jobArea()],
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    favorited: false,
    favoritesCount: 0,
    author: {
      ...getUserByUsername(`testuser${randomIntBetween(0, userNum - 1)}`),
      following: false,
    },
    // author1: {
    //   username: `testuser${randomIntBetween(0, userNum - 1)}`,
    //   bio: 'work at statefarm',
    //   image: 'https://cdn.fakercloud.com/avatars/kvasnic_128.jpg',
    //   following: false,
    // },
  };
});

export const commentList = new Array(articleNum * 3)
  .fill(0)
  .map((item, index) => ({
    id: index,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    body: 'It takes a Jacobian',
    author: {
      ...getUserByUsername(`testuser${randomIntBetween(0, userNum - 1)}`),
      following: false,
    },
    // author1: {
    //   username: 'jake',
    //   bio: 'I work at statefarm',
    //   image: 'https://i.stack.imgur.com/xHWG8.jpg',
    //   following: false,
    // },
  }));

function randomIntBetween(min = 1, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
