import { envConfig } from './env.config';

const rabbitUser = encodeURIComponent(envConfig.rabbit.user ?? '');
const rabbitPass = encodeURIComponent(envConfig.rabbit.pass ?? '');

export const rabbitConfig = {
  url: `amqp://${rabbitUser}:${rabbitPass}@${envConfig.rabbit.host}:${envConfig.rabbit.port}`,
};
