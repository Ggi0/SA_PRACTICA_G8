import { envConfig } from './env.config';

export const rabbitConfig = {
  url: `amqp://${envConfig.rabbit.user}:${envConfig.rabbit.pass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}`,
};