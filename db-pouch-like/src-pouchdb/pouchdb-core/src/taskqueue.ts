export class TaskQueue {
  isReady: boolean;
  failed: boolean;
  queue: Function[];
  db: any;

  constructor() {
    this.isReady = false;
    this.failed = false;
    this.queue = [];
  }

  execute() {
    let fun;
    if (this.failed) {
      while ((fun = this.queue.shift())) {
        fun(this.failed);
      }
    } else {
      while ((fun = this.queue.shift())) {
        fun();
      }
    }
  }

  fail(err) {
    this.failed = err;
    this.execute();
  }

  ready(db) {
    this.isReady = true;
    this.db = db;
    this.execute();
  }

  addTask(fun) {
    this.queue.push(fun);
    if (this.failed) {
      this.execute();
    }
  }
}

export default TaskQueue;
