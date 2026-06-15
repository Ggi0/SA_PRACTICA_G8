import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkService } from './bulk.service';

@Controller('api/admin/movies/bulk')
export class BulkController {
  constructor(
    private readonly bulkService: BulkService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bulkService.uploadCsv(file);
  }
}
