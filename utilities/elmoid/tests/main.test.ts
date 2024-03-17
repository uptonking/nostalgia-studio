import { expect } from 'chai';

import { h, text } from '../src/index';

describe('elmoid framework', () => {
  it('createVNode', () => {
    expect(h('elmoid', { foo: true }, [])).to.deep.equal({
      children: [],
      key: undefined,
      node: undefined,
      props: {
        foo: true,
      },
      type: undefined,
      tag: 'elmoid',
    });
  });

  it('createTextNode', () => {
    expect(text('elmoid')).to.deep.equal({
      children: [],
      key: undefined,
      node: undefined,
      props: {},
      type: 3,
      tag: 'elmoid',
    });
  });
});
