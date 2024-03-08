export interface UserType {
  email: string;
  username: string;
  bio: string;
  image: string;
}

export interface ProfileType {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

export interface ArticleType {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: ProfileType;
}

export interface CommentType {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: ProfileType;
}

export interface ErrorsType {
  [key: string]: string[];
}
