import { Injectable } from '@nestjs/common';
import {
  ServeStaticModuleOptions,
  ServeStaticModuleOptionsFactory,
} from '@nestjs/serve-static';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

@Injectable()
export class UiService implements ServeStaticModuleOptionsFactory {
  createLoggerOptions(): ServeStaticModuleOptions[] {
    // Don't serve UI if SERVE_UI is set to false
    if (process.env.SERVE_UI === 'false') {
      console.log('UI serving disabled by SERVE_UI environment variable');
      return [];
    }

    // Try different possible paths for the UI build directory
    const possiblePaths = [
      join(__dirname, '..', 'ui', 'build'), // Default path
      join(process.cwd(), 'ui', 'build'), // From project root
      join(__dirname, '..', '..', 'ui', 'build'), // Alternative path for some builds
    ];

    let rootPath = possiblePaths[0]; // Default fallback

    // Find the correct path that exists
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        rootPath = path;
        break;
      }
    }

    console.log(`Serving UI from: ${rootPath}`);
    console.log(`Path exists: ${existsSync(rootPath)}`);

    return [
      {
        rootPath,
        renderPath: /^((?!^\/(api|health|api-docs)).)*$/s,
        exclude: ['/api*', '/health*', '/api-docs*'],
        serveStaticOptions: {
          cacheControl: true,
          maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
          etag: true,
          lastModified: true,
        },
      },
    ];
  }
}
