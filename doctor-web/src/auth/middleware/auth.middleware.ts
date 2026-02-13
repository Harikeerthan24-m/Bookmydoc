import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * MIDDLEWARE FOR AUTHENTICATE WITH TOKEN FOR USER AND PRIVATE ROUTES
   * @param req
   * @param res
   * @param next
   */
  async use(req: Request, res: Response, next: NextFunction) {
    console.log('🔐 [AUTH MIDDLEWARE] Processing request:', req.url);
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      console.log('🔐 [AUTH MIDDLEWARE] Token not provided');
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      req['user'] = decodedToken;
      console.log('✅ [AUTH MIDDLEWARE] User authenticated:', decodedToken.uid);
      next();
    } catch (error) {
      console.log(
        '❌ [AUTH MIDDLEWARE] Token verification failed:',
        (error as any).message,
      );
      next(new UnauthorizedException('Invalid token'));
    }
  }
}
