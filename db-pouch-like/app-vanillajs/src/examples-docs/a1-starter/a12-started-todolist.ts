import PouchDB from 'pouchdb-browser';

const qs = document.querySelector.bind(document);

const db = new PouchDB('todo2024');
// const remoteCouch = 'http://admin:111111@localhost:5984/todo2024';
const remoteCouch = '';

db.info((err, info) => {
  db.changes({
    since: info.update_seq,
    live: true,
  }).on('change', showTodos);
});

// We have to create a new todo document and enter it in the database
function addTodo(text) {
  const todo = {
    _id: new Date().toISOString(),
    title: text,
    completed: false,
  };
  db.put(todo)
    .then((result) => {
      console.log('addTodo ok ✅');
      console.log(result);
    })
    .catch((err) => {
      console.log('addTodo error ❌');
      console.log(err);
    });
}

// Show the current list of todos by reading them from the database
function showTodos() {
  db.allDocs({ include_docs: true, descending: true })
    .then((doc) => {
      // @ts-expect-error fix-types
      redrawTodosUI(doc.rows);
    })
    .catch((err) => {
      console.log(err);
    });
}

// User pressed the delete button for a todo, delete it
function deleteButtonPressed(todo) {
  db.remove(todo);
}

// The input box when editing a todo has blurred, we should save
// the new title or delete the todo if the title is empty
function todoBlurred(todo, event) {
  const trimmedText = event.target.value.trim();
  if (!trimmedText) {
    db.remove(todo);
  } else {
    todo.title = trimmedText;
    db.put(todo);
  }
}

// Initialise a sync with the remote server
function sync() {
  const syncDom = qs('#syncMsgContainer');
  syncDom.setAttribute('data-sync-state', 'syncing');
  syncDom.textContent = 'syncing live';

  const opts = { live: true };
  // @ts-expect-error fix-types
  db.sync(remoteCouch, opts, syncError);
}

// There was some form or error syncing
function syncError() {
  const syncDom = qs('#syncMsgContainer');
  syncDom.setAttribute('data-sync-state', 'error');
  syncDom.textContent = 'syncing error';
}

// User has double clicked a todo, display an input so they can edit the title
function todoDblClicked(todo) {
  const div = document.getElementById('li_' + todo._id);
  const inputEditTodo = document.getElementById('input_' + todo._id);
  div.className = 'editing';
  inputEditTodo.focus();
}

// If they press enter while editing an entry, blur it to trigger save or delete
function todoKeyPressed(todo, event) {
  if (event.key === 'Enter') {
    const inputEditTodo = document.getElementById('input_' + todo._id);
    inputEditTodo.blur();
  }
}

const checkboxChanged = (todo, event) => {
  todo.completed = event.target.checked;
  console.log(todo);
  db.put(todo);
};

// Given an object representing a todo, this will create a list item to display it.
function createTodoListItem(todo) {
  const checkboxElem = document.createElement('input');
  checkboxElem.className = 'toggle';
  checkboxElem.type = 'checkbox';
  // checkboxElem.addEventListener('change', checkboxChanged.bind(this as any, todo));
  // @ts-expect-error fix-types
  checkboxElem.addEventListener('change', checkboxChanged.bind(this, todo));

  const label = document.createElement('label');
  label.appendChild(document.createTextNode(todo.title));
  // label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

  const deleteLink = document.createElement('button');
  deleteLink.className = 'destroy';
  deleteLink.textContent = '❌';
  // @ts-expect-error fix-types
  deleteLink.addEventListener('click', deleteButtonPressed.bind(this, todo));

  const divDisplay = document.createElement('div');
  divDisplay.className = 'view';
  divDisplay.appendChild(checkboxElem);
  divDisplay.appendChild(label);
  divDisplay.appendChild(deleteLink);

  const inputEditTodo = document.createElement('input');
  inputEditTodo.id = 'input_' + todo._id;
  inputEditTodo.className = 'edit';
  inputEditTodo.value = todo.title;
  // inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
  // inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

  const li = document.createElement('li');
  li.id = 'li_' + todo._id;
  li.appendChild(divDisplay);
  // li.appendChild(inputEditTodo);

  if (todo.completed) {
    li.className += 'complete';
    checkboxElem.checked = true;
  }

  return li;
}

function redrawTodosUI(todos) {
  const ul = qs('#todoList');
  ul.innerHTML = '';
  todos.forEach((todo) => {
    ul.appendChild(createTodoListItem(todo.doc));
  });
}

function newTodoKeyPressHandler(event) {
  const newTodoDom = qs('#newTodoInput') as HTMLInputElement;
  console.log(';; input ', newTodoDom?.value, event.key);
  if (event.key === 'Enter' && String(newTodoDom.value).trim().length > 0) {
    addTodo(newTodoDom.value);
    newTodoDom.value = '';
  }
}

function addEventListeners() {
  const newTodoDom = qs('#newTodoInput') as HTMLInputElement;
  // 👇🏻 不能监听input事件，因为只在value变化时才触发
  newTodoDom.addEventListener('keydown', newTodoKeyPressHandler, false);
}

/** input, list, sync-message */
function prepareDom() {
  if (!qs('#newTodoInput')) {
    const inputElem = document.createElement('input');
    inputElem.id = 'newTodoInput';
    document.body.appendChild(inputElem);
  }
  if (!qs('#todoList')) {
    const todoListElem = document.createElement('ul');
    todoListElem.id = 'todoList';
    document.body.appendChild(todoListElem);
  }
  if (!qs('#syncMsgContainer')) {
    const syncMsgElem = document.createElement('div');
    syncMsgElem.id = 'syncMsgContainer';
    document.body.appendChild(syncMsgElem);
  }
}

export function a12CreateTodoListApp() {
  prepareDom();
  addEventListeners();
  showTodos();

  if (remoteCouch) {
    sync();
  }
}
