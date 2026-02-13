import type { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

import { IUnsafeObject } from '@common/types';

export const mockJson = jest.fn();

export const mockStatus = jest.fn().mockImplementation(() => ({
  json: mockJson,
}));

export const mockGetResponse = jest.fn().mockImplementation(() => ({
  status: mockStatus,
}));

export const mockGetRequest = jest.fn().mockImplementation(() => ({
  url: '',
}));

export const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
  getResponse: mockGetResponse,
  getRequest: mockGetRequest,
}));

export const mockAppLoggerService = {
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

export function mockNextCallHandler(data: IUnsafeObject) {
  return {
    handle: jest.fn(() => of(data)),
  };
}

export const mockExecutionContext: ExecutionContext = {
  switchToHttp: mockHttpArgumentsHost,
  getClass: jest.fn(),
  getHandler: jest.fn(),
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};
