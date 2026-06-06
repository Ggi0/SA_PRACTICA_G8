import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      framework: 'nestjs',
      timestamp: new Date().toISOString(),
      upstreams: {
        users: process.env.USERS_SERVICE_URL || 'http://localhost:3001',
      },
      routes: {
        public: ['/api/auth/register', '/api/auth/login'],
        protected: ['/api/clientes', '/api/clientes/me', '/api/users'],
      },
    };
  }
}
