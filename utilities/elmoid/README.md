# elmoid
- simple frontend framework inspired by elm and hyperapp

> forked from https://github.com/jorgebucaran/hyperapp /v2.0.22/20220512

- features
  - elm-like architecture: model/state, view, effects
  - composable views functions
  - reusable effects functions
# overview

```js
import { h, text, app } from "@datalking/elmoid";

app({
  view: () => h("main", {}, [
    h("div", { class: "person" }, [
      h("p", {}, text("Hello world")),
    ]),
  ]),
  node: document.getElementById("app"),
})
```

- [hyperapp api reference](https://github.com/jorgebucaran/hyperapp/blob/main/docs/reference.md)

- [hyperapp tutorial](https://github.com/jorgebucaran/hyperapp/blob/main/docs/tutorial.md)
# license

MIT
