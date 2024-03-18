import { type Option } from 'oxide.ts';
import { z } from 'zod';

import { OrderVO } from '@datalking/pivot-entity';

import { WithViewsOrder } from './specifications/index';
import { type View } from './view';

export const viewsOrderSchema = z.string().array();

export class ViewsOrder extends OrderVO {
  static fromArray(ids: string[]): ViewsOrder {
    return new this(ids);
  }
  static empty(): ViewsOrder {
    return new this([]);
  }

  public addView(view: View): WithViewsOrder {
    const order = this.add(view.id.value);
    const vo = new ViewsOrder(order.order);
    return new WithViewsOrder(vo);
  }

  public removeView(view: View): Option<WithViewsOrder> {
    const order = this.remove(view.id.value);
    return order.map((order) => {
      const vo = new ViewsOrder(order.order);
      return new WithViewsOrder(vo);
    });
  }
}
