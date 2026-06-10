// src/messaging/publisher.interface.ts

export const MESSAGE_PUBLISHER = 'MESSAGE_PUBLISHER';

export interface MessagePublisher {
  publish(queue: string, payload: Record<string, unknown>): Promise<void>;
}