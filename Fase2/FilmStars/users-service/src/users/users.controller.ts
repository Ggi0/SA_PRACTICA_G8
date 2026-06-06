import bcrypt from 'bcryptjs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Roles } from '../common/roles.decorator';
import { USER_SERVICE } from '../common/tokens';
import { JwtAuthGuard, RequestWithUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { IUserService } from './user.service';

@Controller('api/clientes')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(@Inject(USER_SERVICE) private readonly users: IUserService) {}

  @Get('me')
  me(@Req() req: RequestWithUser) {
    if (!req.user) throw new UnauthorizedException('Token invalido');
    return this.users.getById(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  list(@Query('activo') activo?: string, @Query('rol') rol?: string, @Query('search') search?: string) {
    return this.users.list({
      activo: parseBoolean(activo),
      rol: rol === 'admin' || rol === 'customer' ? rol : undefined,
      search,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: RequestWithUser) {
    ensureSelfOrAdmin(req, id);
    return this.users.getById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto, @Req() req: RequestWithUser) {
    ensureSelfOrAdmin(req, id);
    return this.users.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.users.updateStatus(id, dto.activo);
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto, @Req() req: RequestWithUser) {
    ensureSelfOrAdmin(req, id);
    const target = await this.users.getRecordById(id);

    if (req.user?.rol !== 'admin') {
      const valid = await bcrypt.compare(String(dto.currentPassword || ''), target.passwordHash);
      if (!valid) throw new UnauthorizedException('La contrasena actual es incorrecta');
    }

    await this.users.changePassword(id, dto.newPassword);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}

function ensureSelfOrAdmin(req: RequestWithUser, targetId: string): void {
  if (req.user?.rol === 'admin') return;
  if (req.user?.id === targetId) return;
  throw new ForbiddenException('No tiene permisos para gestionar este cliente');
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}
