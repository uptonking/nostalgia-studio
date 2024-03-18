import type {
  App,
  CustomPayloads,
  Dispatch,
  ElementVNode,
  MaybeVNode,
  NonEmptyString,
  Props,
  TextVNode,
  VNode,
} from './types';

const SSR_NODE = 1;
const TEXT_NODE = 3;
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const SVG_NS = 'http://www.w3.org/2000/svg';

const map = Array.prototype.map;
const isArray = Array.isArray;

/** simply return argument */
const accessor = <T = unknown>(a: T): T => a;

const createClass = (obj) => {
  let out = '';

  if (typeof obj === 'string') return obj;

  if (isArray(obj)) {
    for (let k = 0, tmp; k < obj.length; k++) {
      if ((tmp = createClass(obj[k]))) {
        out += (out && ' ') + tmp;
      }
    }
  } else {
    for (const k in obj) {
      if (obj[k]) out += (out && ' ') + k;
    }
  }

  return out;
};

const shouldRestart = (a, b) => {
  for (const k in { ...a, ...b }) {
    if (typeof (isArray(a[k]) ? a[k][0] : a[k]) === 'function') {
      b[k] = a[k];
    } else if (a[k] !== b[k]) return true;
  }
};

/** exec oldSubs and register newSubs */
const patchSubs = (oldSubs, newSubs = EMPTY_ARR, dispatch) => {
  const subs = [];
  for (
    let i = 0, oldSub, newSub;
    i < oldSubs.length || i < newSubs.length;
    i++
  ) {
    oldSub = oldSubs[i];
    newSub = newSubs[i];

    subs.push(
      newSub && newSub !== true
        ? !oldSub ||
          newSub[0] !== oldSub[0] ||
          shouldRestart(newSub[1], oldSub[1])
          ? [
              newSub[0],
              newSub[1],
              (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1])),
            ]
          : oldSub
        : oldSub && oldSub[2](),
    );
  }
  return subs;
};

const getKey = (vdom) => (vdom == null ? vdom : vdom.key);

const patchProperty = (node, key, oldValue, newValue, listener, isSvg) => {
  if (key === 'style') {
    // eslint-disable-next-line guard-for-in
    for (const k in { ...oldValue, ...newValue }) {
      oldValue = newValue == null || newValue[k] == null ? '' : newValue[k];
      if (k[0] === '-') {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === 'o' && key[1] === 'n') {
    if (
      !((node.events || (node.events = {}))[(key = key.slice(2))] = newValue)
    ) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== 'list' && key !== 'form' && key in node) {
    node[key] = newValue == null ? '' : newValue;
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};

/** create dom node or text node */
const createNode = (vdom, listener, isSvg) => {
  const props = vdom.props;
  const node =
    vdom.type === TEXT_NODE
      ? document.createTextNode(vdom.tag)
      : (isSvg = isSvg || vdom.tag === 'svg')
        ? document.createElementNS(SVG_NS, vdom.tag, props.is && props)
        : document.createElement(vdom.tag, props.is && props);

  // eslint-disable-next-line guard-for-in
  for (const k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }

  for (let i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode(
        (vdom.children[i] = maybeVNode(vdom.children[i])),
        listener,
        isSvg,
      ),
    );
  }

  return (vdom.node = node);
};

/** recursively update/patch dom node by vdom */
const patch = (
  parent: Node,
  node: Node,
  oldVNode: VNode,
  newVNode: VNode,
  listener,
  isSvg,
) => {
  if (oldVNode === newVNode) {
  } else if (
    oldVNode != null &&
    oldVNode.type === TEXT_NODE &&
    newVNode.type === TEXT_NODE
  ) {
    if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    node = parent.insertBefore(
      createNode((newVNode = maybeVNode(newVNode)), listener, isSvg),
      node,
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    let tmpVKid;
    let oldVKid;

    let oldKey;
    let newKey;

    const oldProps = oldVNode.props;
    const newProps = newVNode.props;

    const oldVKids = oldVNode.children;
    const newVKids = newVNode.children;

    let oldHead = 0;
    let newHead = 0;
    let oldTail = oldVKids.length - 1;
    let newTail = newVKids.length - 1;

    isSvg = isSvg || newVNode.tag === 'svg';

    for (var i in { ...oldProps, ...newProps }) {
      if (
        (i === 'value' || i === 'selected' || i === 'checked'
          ? node[i]
          : oldProps[i]) !== newProps[i]
      ) {
        patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
      }
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldHead])) == null ||
        oldKey !== getKey(newVKids[newHead])
      ) {
        break;
      }

      // const newHeadV = maybeVNode(
      //   newVKids[newHead++],
      //   oldVKids[oldHead++] as VNode,
      // );
      // newVKids[newHead] = newHeadV;

      patch(
        node,
        oldVKids[oldHead]['node'],
        oldVKids[oldHead] as VNode,
        (newVKids[newHead] = maybeVNode(
          newVKids[newHead++],
          oldVKids[oldHead++] as VNode,
        )),
        listener,
        isSvg,
      );
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldTail])) == null ||
        oldKey !== getKey(newVKids[newTail])
      ) {
        break;
      }

      // const newTailV = maybeVNode(
      //   newVKids[newTail--],
      //   oldVKids[oldTail--] as VNode,
      // );
      // newVKids[newTail] = newTailV;
      patch(
        node,
        oldVKids[oldTail]['node'],
        oldVKids[oldTail] as VNode,
        (newVKids[newTail] = maybeVNode(
          newVKids[newTail--],
          oldVKids[oldTail--] as VNode,
        )),
        listener,
        isSvg,
      );
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(
            (newVKids[newHead] = maybeVNode(newVKids[newHead++])),
            listener,
            isSvg,
          ),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node,
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++]['node']);
      }
    } else {
      const newKeyed = {};
      const keyed = {};
      for (let i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i]['key']) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey((oldVKid = oldVKids[oldHead]));
        newKey = getKey(
          (newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid)),
        );

        if (
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }

        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {
            patch(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead] as VNode,
              listener,
              isSvg,
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
              node,
              oldVKid.node,
              oldVKid,
              newVKids[newHead] as VNode,
              listener,
              isSvg,
            );
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead] as VNode,
                listener,
                isSvg,
              );
              newKeyed[newKey] = true;
            } else {
              patch(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead] as VNode,
                listener,
                isSvg,
              );
            }
          }
          newHead++;
        }
      }

      while (oldHead <= oldTail) {
        if (getKey((oldVKid = oldVKids[oldHead++])) == null) {
          node.removeChild(oldVKid.node);
        }
      }

      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }

  newVNode.node = node;
  return node;
};

const propsChanged = (a, b) => {
  for (const p1 in a) if (a[p1] !== b[p1]) return true;
  for (const p2 in b) if (a[p2] !== b[p2]) return true;
};

/**  */
const maybeVNode = (
  newVNode: (VNode & { memo?: any }) | boolean,
  oldVNode?: VNode & { memo?: any },
) => {
  return newVNode !== true && newVNode !== false && newVNode
    ? typeof newVNode.tag === 'function'
      ? ((!oldVNode ||
          oldVNode.memo == null ||
          propsChanged(oldVNode.memo, newVNode.memo)) &&
          // @ts-expect-error fix-types
          ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo),
        oldVNode)
      : newVNode
    : text('');
};

/** create a virtual node for DOM Node */
const recycleNode = (node) =>
  node.nodeType === TEXT_NODE
    ? text(node.nodeValue, node)
    : createVNode(
        node.nodeName.toLowerCase(),
        EMPTY_OBJ as any,
        map.call(node.childNodes, recycleNode),
        SSR_NODE,
        node,
      );

/** stores a view along with any given data for it.
 * - creates a special VNode that is lazily rendered
 */
// export const memo = <S, D extends Indexable = Indexable>(tag: (data: D) => VNode<S>, memo:D): VNode<S> => ({ tag, memo });
export const memo = (tag, memo) => ({ tag, memo });

const createVNode = (tag, { key, ...props }, children, type?, node?) =>
  ({
    tag,
    props,
    key,
    children,
    type,
    node,
  }) as VNode;

/** creates a virtual DOM node representing plain text. */
export const text = <T = unknown>(
  value: T extends symbol | ((..._: unknown[]) => unknown) ? never : T,
  node?,
) =>
  createVNode(value, EMPTY_OBJ as any, EMPTY_ARR, TEXT_NODE, node) as TextVNode;

/** builds a virtual DOM node */
export const h = <S, C = unknown, T extends string = string>(
  tag: NonEmptyString<T>,
  { class: c, ...props }: CustomPayloads<S, C> & Props<S>,
  children: MaybeVNode<S> | MaybeVNode<S>[] = EMPTY_ARR,
) =>
  createVNode(
    tag,
    { ...props, ...(c ? { class: createClass(c) } : EMPTY_OBJ) } as any,
    isArray(children) ? children : [children],
  ) as ElementVNode<S>;

/** ✨ initializes an elmoid app and render it
 */
export const app = <S>({
  node,
  view,
  // @ts-expect-error fix-types
  subscriptions,
  // @ts-expect-error fix-types
  dispatch = accessor,
  // @ts-expect-error fix-types
  init = EMPTY_OBJ,
}: App<S>): Dispatch<S> => {
  let vdom = node && recycleNode(node);
  /** singleton global app state */
  let state;
  let subs = [];
  let busy;
  let render;

  /** exec subs and trigger rerender */
  const update = (newState) => {
    if (state !== newState) {
      state = newState;
      window['stt'] = state;
      if (state == null) {
        dispatch = subscriptions = render = accessor;
      }
      if (subscriptions) {
        subs = patchSubs(subs, subscriptions(state), dispatch);
      }
      if (view && !busy) {
        busy = true;
        requestAnimationFrame(render);
      }
    }
  };

  /** update vdom, then update dom by vdom patch */
  render = () => {
    const oldVdom = vdom;
    vdom = view(state);
    busy = false;
    node = patch(node.parentNode, node, oldVdom, vdom, listener, busy);
    return node;
  };

  /** register events which will trigger rerender */
  const listener = function (event) {
    // @ts-expect-error fix-types
    dispatch(this.events[event.type], event);
  };

  // recursively dispatch action
  // comma (,) operator evaluates each of its operands (from left to right) and returns the value of the last operand
  return (
    (dispatch = dispatch((action, props) => {
      if (typeof action === 'function') {
        return dispatch(action(state, props));
      } else {
        if (isArray(action)) {
          if (typeof action[0] === 'function') {
            return dispatch(action[0], action[1]);
          } else {
            // if action[0] is not function, useful for effects/init
            return action.slice(1).map(
              // return fx && fx !== true && (fx[0] || fx)(dispatch, fx[1]);
              (fx) => {
                if (fx && fx !== true) {
                  const ef = fx[0] || fx;
                  if (typeof ef === 'function') {
                    return ef(dispatch, fx[1]);
                  }
                }

                return false;
              },
              // update dom before exec cb
              update(action[0]),
            );
          }
        } else {
          // if action is not array and not function, mostly an object, update dom
          return update(action);
        }
      }
    }))(init),
    dispatch
  );
};
