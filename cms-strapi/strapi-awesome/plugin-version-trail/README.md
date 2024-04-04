# strapi-plugin-version-trail

> a strapi plugin for enabling versions history for content

- forked from https://github.com/PenguinOfWar/strapi-plugin-paper-trail /MIT/20240215/js
# overview
- features
  - support to enable version history when creating content types
  - support to revert a specific field to a previous version
  - wip: support to diff versions

> ⚠️ If you disable this plugin and then reenable it, all previous versions data will be cleared

# todo
- versions pagination not working: 🐛 v5 bug
  - make pagination configurable

- show version number in list view

- test non-admin user

- slate editor error on save sometines 🐛 v5 bug
  - 复现: 按回车添加block，点击save，Cannot find a descendant at path [1, 1, 0] 

- duplicating records from the admin panel doesn't create an initial version

- preserve versions history after disabling plugin

- restore a delete field
  - Restoration for records deleted by DELETE event.

- send and keep changed fields only
# roadmap
- comments for versions

- tags for versions
  - 允许替换指定version，包括替换当前draft、publish 

- archive for versions
  - 默认显示publish状态，而不显示draft/archive状态

- versions admin page
  - batch delete

- refactor listening logic from router to service

- to-remove

- migrate
  - Injecting components into `editView.right-links` by `injectContentManagerComponent` is deprecated. Please use the `addEditViewSidePanel` API instead
# notes
- The plugin is a middleware listening on the admin and user content management endpoints. 
  - Making changes directly to the records outside of this scope (e.g. from a custom service or controller) will not be logged as a revision by the plugin, however it shouldn't be difficult to manually implement this if needed.
