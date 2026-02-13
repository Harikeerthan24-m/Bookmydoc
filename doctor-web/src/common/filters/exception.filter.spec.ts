import { BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  mockAppLoggerService,
  mockArgumentsHost,
  mockJson,
  mockStatus,
} from './../../../test/mock/functions/mockRequestResponse';
import { ExceptionFilter } from './exception.filter';

describe('Exception Filter', () => {
  let exceptionFilter: ExceptionFilter;
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      providers: [
        ExceptionFilter,
        { provide: Logger, useValue: mockAppLoggerService },
      ],
    }).compile();
    exceptionFilter = app.get<ExceptionFilter>(ExceptionFilter);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('should handle generic errors', () => {
    exceptionFilter.catch(
      new Error('Testing Error handler'),
      mockArgumentsHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockAppLoggerService.warn).toHaveBeenCalledTimes(0);
    expect(mockAppLoggerService.error).toHaveBeenCalledTimes(1);
  });

  it('should handle HTTP exceptions with proper status code', () => {
    exceptionFilter.catch(
      new BadRequestException('Testing Bad Request exception'),
      mockArgumentsHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockAppLoggerService.warn).toHaveBeenCalledTimes(1);
    expect(mockAppLoggerService.error).toHaveBeenCalledTimes(0);
  });

  it('should handle HttpException with cause', () => {
    const error = new BadRequestException('Testing Unknown Exception', {
      cause: 'Testing Cause',
    });

    exceptionFilter.catch(error, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: {
          code: HttpStatus.BAD_REQUEST,
          message: 'Testing Unknown Exception',
          extra: 'Testing Cause',
        },
      }),
    );
  });
});
