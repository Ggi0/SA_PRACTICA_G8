import { Inject, Injectable } from '@nestjs/common';

import {
  FUNCTIONS_ADMIN_REPOSITORY,
} from '../../../common/tokens';

@Injectable()
export class FunctAdmService {
  constructor(
    @Inject(FUNCTIONS_ADMIN_REPOSITORY)
    private readonly repository: any,
  ) {}

  getMoviesCatalog() {
    return this.repository.getMoviesCatalog();
  }

  getRoomsCatalog() {
    return this.repository.getRoomsCatalog();
  }

  findAll() {
    return this.repository.findAll();
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  findByMovie(movieId: string) {
    return this.repository.findByMovie(movieId);
  }

  findByRoom(roomId: string) {
    return this.repository.findByRoom(roomId);
  }

  findByDate(date: string) {
    return this.repository.findByDate(date);
  }

  create(data: any) {
    return this.repository.create(data);
  }

  update(id: string, data: any) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}