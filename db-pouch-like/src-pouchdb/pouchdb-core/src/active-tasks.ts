import { v4 as uuidv4 } from 'uuid';

type Task = {
  id: string;
  name: string;
  created_at: string;
  total_items: any[];
  completed_items?: any[];
};

export class ActiveTasks {
  tasks: Record<string, Task>;

  constructor() {
    this.tasks = {};
  }

  list() {
    return Object.values(this.tasks);
  }

  get(id) {
    return this.tasks[id];
  }

  add(task) {
    const id = uuidv4();
    this.tasks[id] = {
      id,
      name: task.name,
      total_items: task.total_items,
      created_at: new Date().toJSON(),
    };
    return id;
  }

  /* eslint-disable no-unused-vars */
  remove(id, reason?: any) {
    delete this.tasks[id];
    return this.tasks;
  }

  update(id, updatedTask) {
    const task = this.tasks[id];
    if (typeof task !== 'undefined') {
      const mergedTask = {
        id: task.id,
        name: task.name,
        created_at: task.created_at,
        total_items: updatedTask.total_items || task.total_items,
        completed_items: updatedTask.completed_items || task.completed_items,
        updated_at: new Date().toJSON(),
      };
      this.tasks[id] = mergedTask;
    }
    return this.tasks;
  }
}

export default ActiveTasks;
