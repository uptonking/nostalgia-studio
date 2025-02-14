import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { ejs } from 'codemirror-lang-ejs';
import { Compartment } from '@codemirror/state';

const cntErb = `<h1>Hello, <%= @name %>!</h1>
<ul>
  <% @items.each do |item| %>
    <li><%= item %></li>
  <% end %>
</ul>`;
const cntErb2 = `= hello
<% 3.times do |n| %>
* <%= n %>
<% end %>`;
const cntErb3 = `<h1>Welcome, <%= @user.name %></h1>
<% if @user.admin? %>
  <p>You have admin privileges.</p>
<% end %>`;

/**
 * ejs语法高亮的实现支持度很差
 */
export const LangEjs = () => {
  const content = `<h1>Welcome, <%= user.name %></h1>
<% if (user.isAdmin) { %>
  <p>You have admin privileges.</p>
<% } %>
`;
  const content2 = `<h1>Hello, <%= name %>!</h1>
<ul>
  <% items.forEach(function(item) { %>
    <li><%= item %></li>
  <% }); %>
</ul>
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [basicSetup, language.of(ejs())],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
