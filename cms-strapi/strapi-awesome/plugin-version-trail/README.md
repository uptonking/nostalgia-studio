# strapi-plugin-version-trail

> a strapi plugin for enabling versions history for content

- forked from https://github.com/PenguinOfWar/strapi-plugin-paper-trail /MIT/20240215/js
# overview
- features
  - revisions/trails table
  - support to revert to a specific version
  - support to diff versions
# todo
- pagination not working

- slate editor error on save sometines
# roadmap
- test versions with v5 draft/publish
- pass documentId to entityService.create(versionTrailModelName)

- show version number in list view

- support comment

- try to make trailSchema draftAndPublish true

- versions pagination not working

- 似乎没用到，待移除

- migrate
  - Injecting components into editView.right-links is deprecated. Please use the `addEditViewSidePanel` API instead
# notes
- limitation: 

- ❓ why `strapi` variable can be accessed from middleware as global variable
