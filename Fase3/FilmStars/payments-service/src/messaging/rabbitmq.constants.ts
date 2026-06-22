// src/messaging/rabbitmq.constants.ts

export const RABBITMQ_QUEUES = {
  PAYMENT_PROCESS: 'payment_process_queue',
  PAYMENT_RESULT: 'payment_result_queue',

  BOLETO_USADO: 'boleto_usado_queue',

} as const;

