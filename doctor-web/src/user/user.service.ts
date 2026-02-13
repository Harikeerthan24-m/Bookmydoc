import { Injectable, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { IApiResponse, IUnsafeObject } from '@common/types';

@Injectable()
export class UserService {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * LOGOUT USER
   * @param userId
   */
  async logout(userId: string): Promise<IApiResponse<IUnsafeObject>> {
    try {
      await this.firebaseService.getAuth().revokeRefreshTokens(userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Logout successfully',
        data: null,
      };
    } catch (error) {
      // Handle errors if necessary
      throw new Error('Failed to logout');
    }
  }

  /**
   * CHECKING USER AUTHENTICATION
   * @param userId
   * @returns
   */
  async userAuthChecker(userId: string): Promise<IApiResponse<IUnsafeObject>> {
    try {
      const userRecord = await this.firebaseService.getAuth().getUser(userId);

      return {
        message: 'User auth checked successfully',
        statusCode: HttpStatus.OK,
        data: { ...userRecord },
      };
    } catch (error) {
      return {
        message: 'An error occurred while checking user auth email',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }
}
