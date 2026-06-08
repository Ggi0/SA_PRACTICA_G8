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
        movies: process.env.MOVIES_SERVICE_URL || 'http://localhost:3002',
        reservas: process.env.RESERVAS_SERVICE_URL || 'http://localhost:3003',
      },
      routes: {
        public: [
          '/api/auth/register',
          '/api/auth/login',
          '/api/movies',
          '/api/movies/cities',
        ],
        protected: ['/api/clientes', '/api/clientes/me', '/api/users'],
      },
    };
  }
}
