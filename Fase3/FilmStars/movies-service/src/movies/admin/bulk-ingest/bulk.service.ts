import { Injectable } from '@nestjs/common';
import { AppError } from '../../../common/app-error';
import { BulkRepository } from './bulk.repository';
import { CsvParser, ParseCsvResult } from './csv.parser';

export interface BulkUploadResponse {
  summary: {
    totalFilas: number;
    procesadasCorrectamente: number;
    rechazadas: number;
  };
  message: string;
  errors: Array<{
    rowNumber: number;
    raw: Record<string, string>;
    errors: Array<{
      field: string;
      message: string;
    }>;
  }>;
}

@Injectable()
export class BulkService {
  constructor(
    private readonly bulkRepository: BulkRepository,
    private readonly csvParser: CsvParser,
  ) {}

  async uploadCsv(file: Express.Multer.File): Promise<BulkUploadResponse> {
    this.validateUploadedFile(file);

    const genresCatalog = await this.bulkRepository.getGenresCatalog();
    const parseResult = this.csvParser.parse(file.buffer, genresCatalog);

    this.validateStructuralCsvErrors(parseResult);

    if (parseResult.totalRows === 0) {
      throw new AppError(
        400,
        'El archivo CSV no contiene filas de datos para procesar',
        'EMPTY_CSV_DATA',
      );
    }

    const insertResult = await this.bulkRepository.bulkInsertMovies(
      parseResult.validRows,
    );

    const allErrors = [
      ...parseResult.invalidRows,
      ...insertResult.failedRows,
    ];

    const response: BulkUploadResponse = {
      summary: {
        totalFilas: parseResult.totalRows,
        procesadasCorrectamente: insertResult.insertedCount,
        rechazadas: allErrors.length,
      },
      message: `Se cargaron ${insertResult.insertedCount} películas correctamente. ${allErrors.length} filas tuvieron errores.`,
      errors: allErrors,
    };

    return response;
  }

  private validateUploadedFile(file?: Express.Multer.File) {
    if (!file) {
      throw new AppError(
        400,
        'Debes subir un archivo CSV válido',
        'BAD_CSV_FILE',
      );
    }

    const originalName = file.originalname?.toLowerCase() || '';
    const mimeType = file.mimetype?.toLowerCase() || '';

    const validMimeTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'text/plain',
    ];

    const hasCsvExtension = originalName.endsWith('.csv');
    const isValidMimeType = validMimeTypes.includes(mimeType);

    if (!hasCsvExtension && !isValidMimeType) {
      throw new AppError(
        400,
        'Debes subir un archivo con formato .csv',
        'BAD_CSV_FILE',
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new AppError(
        400,
        'El archivo CSV está vacío',
        'EMPTY_CSV_FILE',
      );
    }
  }

  /**
   * Errores estructurales del archivo:
   * - CSV vacío
   * - sin filas
   * - cabecera incorrecta
   *
   * Esos casos se manejan como 400, porque el archivo completo no es válido.
   * Los errores por fila se devuelven en el response normal.
   */
  private validateStructuralCsvErrors(parseResult: ParseCsvResult) {
    if (!parseResult.invalidRows.length) {
      return;
    }

    const firstInvalid = parseResult.invalidRows[0];
    const fields = firstInvalid.errors.map((e) => e.field);

    const hasHeaderError = fields.some((field) =>
      [
        'titulo',
        'sinopsis',
        'duracion_min',
        'clasificacion',
        'poster_url',
        'fecha_estreno',
        'tipo',
        'activa',
        'generos',
      ].includes(field),
    );

    const hasFileError = fields.includes('file');

    // Si no hay filas válidas y el problema es estructural, rechazamos el archivo completo
    if (parseResult.validRows.length === 0 && (hasHeaderError || hasFileError)) {
      const detailMessage = firstInvalid.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join(' | ');

      throw new AppError(
        400,
        `El archivo CSV no tiene el formato esperado. ${detailMessage}`,
        'INVALID_CSV_STRUCTURE',
      );
    }
  }
}