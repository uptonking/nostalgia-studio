import { fromEntries } from '../utils/object';
import {
  LoadLoginPage,
  LoadRegisterPage,
  LoginPage,
  RegisterPage,
} from './auth';
import { HomePage, LoadHomePage } from './home';
import {
  ARTICLE,
  EDITOR,
  HOME,
  LOGIN,
  NEW_EDITOR,
  PROFILE,
  PROFILE_FAVORITED,
  REGISTER,
  SETTINGS,
} from './links';

// import { ArticlePage, LoadArticlePage } from './article';
// import { EditorPage, LoadEditorPage, LoadNewEditorPage } from './editor';
// import {
//   LoadProfileFavoritedPage,
//   LoadProfilePage,
//   ProfilePage,
// } from './profile.js';

// import { SettingsPage, LoadSettingsPage } from "./settings.js";

/** routePath, view, effect */
const pageConfig = [
  [HOME, HomePage, LoadHomePage],
  [LOGIN, LoginPage, LoadLoginPage],
  [REGISTER, RegisterPage, LoadRegisterPage],
  // [SETTINGS, SettingsPage, LoadSettingsPage],
  // [NEW_EDITOR, EditorPage, LoadNewEditorPage],
  // [EDITOR, EditorPage, LoadEditorPage],
  // [ARTICLE, ArticlePage, LoadArticlePage],
  // [PROFILE, ProfilePage, LoadProfilePage],
  // [PROFILE_FAVORITED, ProfilePage, LoadProfileFavoritedPage],
];

export const pathsToViews = fromEntries(pageConfig);

export const pathsToEffects = pageConfig.map(([path, _, initAction]) => {
  return [path, initAction];
});
