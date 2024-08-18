import type { Completion, CompletionSource } from '@codemirror/autocomplete';
import type { EditorState, Text } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';

/// Describes an element in your XML document schema.
export interface ElementSpec {
  /// The element name.
  name: string;
  /// Allowed children in this element. When not given, all elements
  /// are allowed inside it.
  children?: readonly string[];
  /// When given, allows users to complete the given content strings
  /// as plain text when at the start of the element.
  textContent?: readonly string[];
  /// Whether this element may appear at the top of the document.
  top?: boolean;
  /// Allowed attributes in this element. Strings refer to attributes
  /// specified in [`XMLConfig.attrs`](#lang-xml.XMLConfig.attrs), but
  /// you can also provide one-off [attribute
  /// specs](#lang-xml.AttrSpec). Attributes marked as
  /// [`global`](#lang-xml.AttrSpec.global) are allowed in every
  /// element, and don't have to be mentioned here.
  attributes?: readonly (string | AttrSpec)[];
  /// Can be provided to add extra fields to the
  /// [completion](#autocompletion.Completion) object created for this
  /// element.
  completion?: Partial<Completion>;
}

/// Describes an attribute in your XML schema.
export interface AttrSpec {
  /// The attribute name.
  name: string;
  /// Pre-defined values to complete for this attribute.
  values?: readonly (string | Completion)[];
  /// When `true`, this attribute can be added to all elements.
  global?: boolean;
  /// Provides extra fields to the
  /// [completion](#autocompletion.Completion) object created for this
  /// element
  completion?: Partial<Completion>;
}

function tagName(doc: Text, tag: SyntaxNode | null) {
  const name = tag && tag.getChild('TagName');
  return name ? doc.sliceString(name.from, name.to) : '';
}

function elementName(doc: Text, tree: SyntaxNode | null) {
  const tag = tree && tree.firstChild;
  return !tag || tag.name != 'OpenTag' ? '' : tagName(doc, tag);
}

function attrName(doc: Text, tag: SyntaxNode | null, pos: number) {
  const attr =
    tag &&
    tag.getChildren('Attribute').find((a) => a.from <= pos && a.to >= pos);
  const name = attr && attr.getChild('AttributeName');
  return name ? doc.sliceString(name.from, name.to) : '';
}

function findParentElement(tree: SyntaxNode | null) {
  for (let cur = tree && tree.parent; cur; cur = cur.parent)
    if (cur.name == 'Element') return cur;
  return null;
}

type Location = {
  type: 'openTag' | 'closeTag' | 'attrValue' | 'attrName' | 'tag';
  from: number;
  context: SyntaxNode | null;
} | null;

function findLocation(state: EditorState, pos: number): Location {
  let at = syntaxTree(state).resolveInner(pos, -1);
  let inTag = null;
  for (let cur = at; !inTag && cur.parent; cur = cur.parent)
    if (
      cur.name == 'OpenTag' ||
      cur.name == 'CloseTag' ||
      cur.name == 'SelfClosingTag' ||
      cur.name == 'MismatchedCloseTag'
    )
      inTag = cur;
  if (inTag && (inTag.to > pos || inTag.lastChild!.type.isError)) {
    const elt = inTag.parent!;
    if (at.name == 'TagName')
      return inTag.name == 'CloseTag' || inTag.name == 'MismatchedCloseTag'
        ? { type: 'closeTag', from: at.from, context: elt }
        : { type: 'openTag', from: at.from, context: findParentElement(elt) };
    if (at.name == 'AttributeName')
      return { type: 'attrName', from: at.from, context: inTag };
    if (at.name == 'AttributeValue')
      return { type: 'attrValue', from: at.from, context: inTag };
    const before =
      at == inTag || at.name == 'Attribute' ? at.childBefore(pos) : at;
    if (before?.name == 'StartTag')
      return { type: 'openTag', from: pos, context: findParentElement(elt) };
    if (before?.name == 'StartCloseTag' && before.to <= pos)
      return { type: 'closeTag', from: pos, context: elt };
    if (before?.name == 'Is')
      return { type: 'attrValue', from: pos, context: inTag };
    if (before) return { type: 'attrName', from: pos, context: inTag };
    return null;
  } else if (at.name == 'StartCloseTag') {
    return { type: 'closeTag', from: pos, context: at.parent! };
  }
  while (at.parent && at.to == pos && !at.lastChild?.type.isError)
    at = at.parent;
  if (at.name == 'Element' || at.name == 'Text' || at.name == 'Document')
    return {
      type: 'tag',
      from: pos,
      context: at.name == 'Element' ? at : findParentElement(at),
    };
  return null;
}

class Element {
  name: string;
  completion: Completion;
  openCompletion: Completion;
  closeCompletion: Completion;
  closeNameCompletion: Completion;
  children: Element[] = [];
  text: Completion[];

  constructor(
    spec: ElementSpec,
    readonly attrs: readonly Completion[],
    readonly attrValues: { [name: string]: readonly Completion[] },
  ) {
    this.name = spec.name;
    this.completion = {
      type: 'type',
      ...(spec.completion || {}),
      label: this.name,
    };
    this.openCompletion = { ...this.completion, label: '<' + this.name };
    this.closeCompletion = {
      ...this.completion,
      label: '</' + this.name + '>',
      boost: 2,
    };
    this.closeNameCompletion = { ...this.completion, label: this.name + '>' };
    this.text = spec.textContent
      ? spec.textContent.map((s) => ({ label: s, type: 'text' }))
      : [];
  }
}

const Identifier = /^[:\-\.\w\u00b7-\uffff]*$/;

function attrCompletion(spec: AttrSpec): Completion {
  return { type: 'property', ...(spec.completion || {}), label: spec.name };
}

function valueCompletion(spec: string | Completion): Completion {
  return typeof spec === 'string'
    ? { label: `"${spec}"`, type: 'constant' }
    : /^"/.test(spec.label)
      ? spec
      : { ...spec, label: `"${spec.label}"` };
}

/// Create a completion source for the given schema.
export function completeFromSchema(
  eltSpecs: readonly ElementSpec[],
  attrSpecs: readonly AttrSpec[],
): CompletionSource {
  const allAttrs: Completion[] = [];
  const globalAttrs: Completion[] = [];
  const attrValues: { [name: string]: readonly Completion[] } =
    Object.create(null);
  for (const s of attrSpecs) {
    const completion = attrCompletion(s);
    allAttrs.push(completion);
    if (s.global) globalAttrs.push(completion);
    if (s.values) attrValues[s.name] = s.values.map(valueCompletion);
  }

  const allElements: Element[] = [];
  let topElements: Element[] = [];
  const byName: { [name: string]: Element } = Object.create(null);
  for (const s of eltSpecs) {
    let attrs = globalAttrs;
    let attrVals = attrValues;
    if (s.attributes)
      attrs = attrs.concat(
        s.attributes.map((s) => {
          if (typeof s === 'string')
            return (
              allAttrs.find((a) => a.label == s) || {
                label: s,
                type: 'property',
              }
            );
          if (s.values) {
            if (attrVals == attrValues) attrVals = Object.create(attrVals);
            attrVals[s.name] = s.values.map(valueCompletion);
          }
          return attrCompletion(s);
        }),
      );
    const elt = new Element(s, attrs, attrVals);
    byName[elt.name] = elt;
    allElements.push(elt);
    if (s.top) topElements.push(elt);
  }
  if (!topElements.length) topElements = allElements;
  for (let i = 0; i < allElements.length; i++) {
    const s = eltSpecs[i];
    const elt = allElements[i];
    if (s.children) {
      for (const ch of s.children)
        if (byName[ch]) elt.children.push(byName[ch]);
    } else {
      elt.children = allElements;
    }
  }

  return (cx) => {
    const { doc } = cx.state;
    const loc = findLocation(cx.state, cx.pos);
    if (!loc || (loc.type == 'tag' && !cx.explicit)) return null;
    const { type, from, context } = loc;
    if (type == 'openTag') {
      let children = topElements;
      const parentName = elementName(doc, context);
      if (parentName) {
        const parent = byName[parentName];
        children = parent?.children || allElements;
      }
      return {
        from,
        options: children.map((ch) => ch.completion),
        validFor: Identifier,
      };
    } else if (type == 'closeTag') {
      const parentName = elementName(doc, context);
      return parentName
        ? {
            from,
            to: cx.pos + (doc.sliceString(cx.pos, cx.pos + 1) == '>' ? 1 : 0),
            options: [
              byName[parentName]?.closeNameCompletion || {
                label: parentName + '>',
                type: 'type',
              },
            ],
            validFor: Identifier,
          }
        : null;
    } else if (type == 'attrName') {
      const parent = byName[tagName(doc, context)];
      return {
        from,
        options: parent?.attrs || globalAttrs,
        validFor: Identifier,
      };
    } else if (type == 'attrValue') {
      const attr = attrName(doc, context, from);
      if (!attr) return null;
      const parent = byName[tagName(doc, context)];
      const values = (parent?.attrValues || attrValues)[attr];
      if (!values || !values.length) return null;
      return {
        from,
        to: cx.pos + (doc.sliceString(cx.pos, cx.pos + 1) == '"' ? 1 : 0),
        options: values,
        validFor: /^"[^"]*"?$/,
      };
    } else if (type == 'tag') {
      const parentName = elementName(doc, context);
      const parent = byName[parentName];
      const closing = [];
      const last = context && context.lastChild;
      if (
        parentName &&
        (!last || last.name != 'CloseTag' || tagName(doc, last) != parentName)
      )
        closing.push(
          parent
            ? parent.closeCompletion
            : { label: '</' + parentName + '>', type: 'type', boost: 2 },
        );
      let options = closing.concat(
        (parent?.children || (context ? allElements : topElements)).map(
          (e) => e.openCompletion,
        ),
      );
      if (context && parent?.text.length) {
        const openTag = context.firstChild!;
        if (
          openTag.to > cx.pos - 20 &&
          !/\S/.test(cx.state.sliceDoc(openTag.to, cx.pos))
        )
          options = options.concat(parent.text);
      }
      return {
        from,
        options,
        validFor: /^<\/?[:\-\.\w\u00b7-\uffff]*$/,
      };
    } else {
      return null;
    }
  };
}
