import { Injectable } from '@nestjs/common';

export type MovieType = 'ESTRENO' | 'PREVENTA' | 'REESTRENO';

export interface GenreCatalogItem {
  id: string;
  nombre: string;
}

export interface CsvRowErrorDetail {
  field: string;
  message: string;
}

export interface CsvRowError {
  rowNumber: number;
  raw: Record<string, string>;
  errors: CsvRowErrorDetail[];
}

export interface BulkMovieParsedRow {
  rowNumber: number;
  titulo: string;
  sinopsis: string | null;
  duracion_min: number;
  clasificacion: string | null;
  poster_url: string | null;
  fecha_estreno: string | null;
  tipo: MovieType;
  activa: boolean;
  generoIds: string[];
  generosTexto: string[];
  raw: Record<string, string>;
}

export interface ParseCsvResult {
  totalRows: number;
  validRows: BulkMovieParsedRow[];
  invalidRows: CsvRowError[];
}

const REQUIRED_HEADERS = [
  'titulo',
  'sinopsis',
  'duracion_min',
  'clasificacion',
  'poster_url',
  'fecha_estreno',
  'tipo',
  'activa',
  'generos',
];

@Injectable()
export class CsvParser {
  parse(
    fileBuffer: Buffer,
    availableGenres: GenreCatalogItem[],
  ): ParseCsvResult {
    const content = fileBuffer.toString('utf-8').replace(/^\uFEFF/, '');

    if (!content.trim()) {
      return {
        totalRows: 0,
        validRows: [],
        invalidRows: [
          {
            rowNumber: 1,
            raw: {},
            errors: [
              {
                field: 'file',
                message: 'El archivo CSV está vacío',
              },
            ],
          },
        ],
      };
    }

    const rows = this.parseCsv(content);

    if (rows.length === 0) {
      return {
        totalRows: 0,
        validRows: [],
        invalidRows: [
          {
            rowNumber: 1,
            raw: {},
            errors: [
              {
                field: 'file',
                message: 'No se encontraron filas en el archivo CSV',
              },
            ],
          },
        ],
      };
    }

    const headers = rows[0].map((h) => h.trim());
    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      return {
        totalRows: Math.max(rows.length - 1, 0),
        validRows: [],
        invalidRows: [
          {
            rowNumber: 1,
            raw: {},
            errors: missingHeaders.map((header) => ({
              field: header,
              message: `Falta la columna obligatoria "${header}"`,
            })),
          },
        ],
      };
    }

    const genreMap = new Map<string, GenreCatalogItem>();
    for (const genre of availableGenres) {
      genreMap.set(this.normalizeText(genre.nombre), genre);
    }

    const validRows: BulkMovieParsedRow[] = [];
    const invalidRows: CsvRowError[] = [];

    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];

      // Ignorar filas completamente vacías
      if (row.every((cell) => !String(cell ?? '').trim())) {
        continue;
      }

      const rowNumber = index + 1; // línea real en el CSV
      const raw = this.buildRawObject(headers, row);
      const errors: CsvRowErrorDetail[] = [];

      const titulo = this.getValue(raw.titulo);
      const sinopsis = this.getNullableValue(raw.sinopsis);
      const duracionMinRaw = this.getValue(raw.duracion_min);
      const clasificacion = this.getNullableValue(raw.clasificacion);
      const posterUrl = this.getNullableValue(raw.poster_url);
      const fechaEstrenoRaw = this.getNullableValue(raw.fecha_estreno);
      const tipoRaw = this.getValue(raw.tipo).toUpperCase();
      const activaRaw = this.getNullableValue(raw.activa);
      const generosRaw = this.getValue(raw.generos);

      if (!titulo) {
        errors.push({
          field: 'titulo',
          message: 'El campo titulo es obligatorio',
        });
      } else if (titulo.length > 200) {
        errors.push({
          field: 'titulo',
          message: 'El campo titulo no puede superar 200 caracteres',
        });
      }

      const duracionMin = Number(duracionMinRaw);
      if (!duracionMinRaw) {
        errors.push({
          field: 'duracion_min',
          message: 'El campo duracion_min es obligatorio',
        });
      } else if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
        errors.push({
          field: 'duracion_min',
          message:
            'El campo duracion_min debe ser un número entero mayor que 0',
        });
      }

      const tipo = tipoRaw as MovieType;
      if (!['ESTRENO', 'PREVENTA', 'REESTRENO'].includes(tipoRaw)) {
        errors.push({
          field: 'tipo',
          message:
            'El campo tipo debe ser uno de: ESTRENO, PREVENTA, REESTRENO',
        });
      }

      let activa = true;
      if (activaRaw !== null && activaRaw !== '') {
        const parsedBoolean = this.parseBoolean(activaRaw);
        if (parsedBoolean === null) {
          errors.push({
            field: 'activa',
            message:
              'El campo activa debe ser: true, false, 1, 0, si, sí o no',
          });
        } else {
          activa = parsedBoolean;
        }
      }

      if (posterUrl && !this.isValidUrl(posterUrl)) {
        errors.push({
          field: 'poster_url',
          message: 'El campo poster_url debe ser una URL válida',
        });
      }

      let fechaEstreno: string | null = null;
      if (fechaEstrenoRaw) {
        if (!this.isValidDateOnly(fechaEstrenoRaw)) {
          errors.push({
            field: 'fecha_estreno',
            message:
              'El campo fecha_estreno debe tener el formato YYYY-MM-DD y ser una fecha válida',
          });
        } else {
          fechaEstreno = fechaEstrenoRaw;
        }
      }

      const generoNames = generosRaw
        .split('|')
        .map((g) => g.trim())
        .filter(Boolean);

      if (generoNames.length === 0) {
        errors.push({
          field: 'generos',
          message:
            'El campo generos es obligatorio y debe contener al menos un género',
        });
      }

      const generoIds: string[] = [];
      const unknownGenres: string[] = [];

      const seenGenreIds = new Set<string>();

      for (const genreName of generoNames) {
        const normalized = this.normalizeText(genreName);
        const genre = genreMap.get(normalized);

        if (!genre) {
          unknownGenres.push(genreName);
          continue;
        }

        if (!seenGenreIds.has(genre.id)) {
          generoIds.push(genre.id);
          seenGenreIds.add(genre.id);
        }
      }

      if (unknownGenres.length > 0) {
        errors.push({
          field: 'generos',
          message: `Los siguientes géneros no existen en catálogo: ${unknownGenres.join(', ')}`,
        });
      }

      if (errors.length > 0) {
        invalidRows.push({
          rowNumber,
          raw,
          errors,
        });
        continue;
      }

      validRows.push({
        rowNumber,
        titulo,
        sinopsis,
        duracion_min: duracionMin,
        clasificacion,
        poster_url: posterUrl,
        fecha_estreno: fechaEstreno,
        tipo,
        activa,
        generoIds,
        generosTexto: generoNames,
        raw,
      });
    }

    return {
      totalRows: validRows.length + invalidRows.length,
      validRows,
      invalidRows,
    };
  }

  private buildRawObject(
    headers: string[],
    row: string[],
  ): Record<string, string> {
    const raw: Record<string, string> = {};

    headers.forEach((header, index) => {
      raw[header] = (row[index] ?? '').trim();
    });

    return raw;
  }

  private getValue(value?: string): string {
    return String(value ?? '').trim();
  }

  private getNullableValue(value?: string): string | null {
    const normalized = String(value ?? '').trim();
    return normalized === '' ? null : normalized;
  }

  private parseBoolean(value: string): boolean | null {
    const normalized = this.normalizeText(value);

    if (['true', '1', 'si', 'sí'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }

    return null;
  }

  private isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  private isValidDateOnly(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Parser CSV sin dependencia externa.
   * Soporta:
   * - comas dentro de campos entre comillas
   * - saltos de línea
   * - comillas escapadas ""
   */
  private parseCsv(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }

        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        continue;
      }

      currentField += char;
    }

    // Añadir el último campo/fila si existe
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  }
}