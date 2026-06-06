export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'customer';
}
