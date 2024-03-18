import { Option } from 'oxide.ts';

import { andOptions, ValueObject } from '@datalking/pivot-entity';

import { type Field } from '../field/index';
import { type TableCompositeSpecificaiton } from '../specifications/interface';
import { type WithTableView } from './specifications/views.specification';
import { WithNewView, WithoutView } from './specifications/views.specification';
import { View } from './view';
import { type ICreateViewSchema } from './view.schema';
import { type ICreateViewInput_internal } from './view.type';

/** manager of multi views */
export class Views extends ValueObject<View[]> {
  get views() {
    return this.props;
  }

  get ids() {
    return this.views.map((view) => view.id);
  }

  get defaultView(): Option<View> {
    return Option(this.views.at(0));
  }

  get count() {
    return this.views.length;
  }

  addView(view: View) {
    this.views.push(view);
  }

  createView(input: ICreateViewSchema): WithTableView {
    const view = View.create(input);
    return new WithNewView(view);
  }

  duplcateView(id: string): WithTableView {
    const view = this.getById(id)?.unwrap();
    const newView = view.duplicate({ name: view.name.value });
    return new WithNewView(newView);
  }

  removeView(id: string): WithoutView {
    const viewsCount = this.count;
    if (viewsCount <= 1) {
      throw new Error('cannot remove last view');
    }
    const view = this.getById(id).unwrap();
    return new WithoutView(view);
  }

  removeField(field: Field): Option<TableCompositeSpecificaiton> {
    const specs = this.views.map((view) => view.removeField(field));
    return andOptions(...specs);
  }

  getById(viewId?: string): Option<View> {
    return Option(this.views.find((v) => v.id.value === viewId));
  }

  static create(views: ICreateViewInput_internal[] = []): Views {
    return new this(views.map((v) => View.create(v)));
  }
}
