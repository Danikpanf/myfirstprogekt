import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type OrderEvent = { orderId: string; payload: unknown };

@Injectable()
export class OrderEventsService {
  readonly updates = new Subject<OrderEvent>();

  emit(orderId: string, payload: unknown) {
    this.updates.next({ orderId, payload });
  }
}
