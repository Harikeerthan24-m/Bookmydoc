import { Injectable, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IApiResponse, IUnsafeObject } from '@common/types';
import { FirebaseAuthError } from 'firebase-admin/lib/utils/error';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * VERIFY PROVIDER TOKEN
   // region VERIFY TOKEN METHOD
   * @param token
   * @param type
   * @returns
   */
  private async verifyProviderToken(
    token: string,
    type: 'google' | 'apple' | false,
  ) {
    console.log('🔐 [AUTH SERVICE] Starting token verification:', {
      hasToken: !!token,
      tokenLength: token?.length,
      type,
    });

    try {
      const providerUser = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      console.log('✅ [AUTH SERVICE] Token verified successfully:', {
        uid: providerUser.uid,
        email: providerUser.email,
        emailVerified: providerUser.email_verified,
        name: providerUser.name,
      });

      if (!providerUser) {
        console.log(
          '❌ [AUTH SERVICE] No provider user returned from token verification',
        );
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
          data: null,
          error: {
            code: HttpStatus.UNAUTHORIZED,
            message: 'Invalid token',
          },
        };
      }

      if (type === 'google') {
        console.log('🔍 [AUTH SERVICE] Processing Google provider user data');
        const googleUser = {
          uid: providerUser.uid || providerUser.user_id,
          email: providerUser.email,
          displayName: providerUser.name || '',
          photoURL: providerUser.picture || '',
          emailVerified: providerUser.email_verified,
          role: providerUser?.role || '',
        };
        console.log(
          '✅ [AUTH SERVICE] Google user object created:',
          googleUser,
        );
        return googleUser;
      }

      if (type === 'apple') {
        console.log('🍎 [AUTH SERVICE] Processing Apple provider user data');
        return providerUser;
      }

      // For regular email/password login (type === false)
      console.log(
        '📧 [AUTH SERVICE] Processing email/password login user data',
      );
      return providerUser;
    } catch (error) {
      console.log('💥 [AUTH SERVICE] Token verification failed:', {
        error: (error as Error)?.message,
        code: (error as any)?.code,
        type,
      });
      throw error;
    }
  }

  /**
   * GENERATE TOKEN FOR USER
   // region USER TOKEN METHOD
   * @param uid
   * @returns
   */
  private async generateToken(uid: string, role: string): Promise<string> {
    return await this.firebaseService.getAuth().createCustomToken(uid, {
      role,
    });
  }

  /**
   * THE ROLE CHECKER METHOD
   // region ROLE CHECK METHOD
   * @param role
   * @returns
   */
  private roleChecker(role: string): boolean {
    if (role !== 'doctor' && role !== 'customer' && role !== 'admin') {
      return false;
    }
    return true;
  }

  /**
   * Generate a unique username based on the display name
   // region UNIQUE USERNAME METHOD
   * @param displayName
   * @returns A unique username
   */
  private async generateUniqueUserName(displayName: string): Promise<string> {
    let userName = this.generateUserName(displayName);
    let isUnique = false;
    let attempt = 1;

    while (!isUnique) {
      const userDoc = await this.firebaseService
        .getFireStore()
        .collection('profiles')
        .doc(userName)
        .get();
      if (!userDoc.exists) {
        isUnique = true;
        return userName;
      }

      userName = `${this.generateUserName(displayName)}${attempt}`;
      attempt++;
    }
    throw new Error('Unable to generate a unique username');
  }

  /**
   * Helper method to create a sanitized username from the display name
   // region USERNAME HELPER
   * @param displayName
   * @returns A sanitized username
   */
  private generateUserName(displayName: string): string {
    return displayName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 20);
  }

  /**
   * REGISTRATION METHOD
   // region REGISTER SERVICE
   * @param param0 { name: string, email: String, password: String, role: string, token: String, provider: String }
   */
  async register({
    name,
    email,
    password,
    role = 'customer',
    token,
    provider = false,
  }: RegisterDto): Promise<IApiResponse<IUnsafeObject>> {
    try {
      let userRecord: any;

      // Role checked..
      const validRole = this.roleChecker(role);

      if (validRole === false) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid Role',
          data: null,
          error: {
            code: HttpStatus.UNAUTHORIZED,
            message: 'Invalid Role',
          },
        };
      }

      if (token) {
        userRecord = await this.verifyProviderToken(token, provider);
      }

      // If user exists, optionally update their profile
      if (!provider) {
        userRecord = await this.firebaseService.getAuth().createUser({
          email,
          password: password,
          displayName: name,
        });
      }

      // Generate a unique username based on the display name..
      const uniqueUserName = await this.generateUniqueUserName(
        !provider ? name : userRecord.displayName,
      );

      // The uuid for profile id here..
      const userId = String(userRecord?.uid || uuidv7());

      // Add/update user profile in Firestore
      await this.firebaseService
        .getFirestore()
        .collection('profiles')
        .doc(userId)
        .set(
          {
            uid: userId,
            display_name: !provider ? name : userRecord.displayName,
            user_name: uniqueUserName,
            email: !provider ? email : userRecord.email,
            photoUrl: !provider ? '' : userRecord.photoURL,
            role: role,
            isVerified: userRecord.emailVerified,
            bio: '',
            phone: '',
            title: '',
            gender: '',
            experience: 0,
            expertiseList: [],
            availability: [],
            availabilitySlots: JSON.stringify([]),
            ratings: [],
            star_rating: 0,
            services: [],
            location: {
              address: '',
              city: '',
              state: '',
              country: '',
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      // Generate a new id token..
      const idToken = await this.generateToken(userRecord.uid, role);

      return {
        message: 'User registered successfully!',
        statusCode: HttpStatus.CREATED,
        data: {
          userId: userId,
          email: userRecord.email,
          name: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          photoUrl: userRecord.photoURL,
          creationTime: userRecord.metadata?.creationTime,
          lastSignInTime: userRecord.metadata?.lastSignInTime,
          lastRefreshTime: userRecord.metadata?.lastRefreshTime,
          idToken,
        },
      };
    } catch (error) {
      const firebaseError = error as FirebaseAuthError;
      if (firebaseError.code) {
        switch (firebaseError.code) {
          case 'auth/email-already-exists':
            return {
              statusCode: HttpStatus.CONFLICT,
              message: 'Email already registered',
              data: null,
              error: {
                code: HttpStatus.CONFLICT,
                message:
                  'This email address is already registered. Please try logging in instead or use a different email address.',
              },
            };
          case 'auth/weak-password':
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Password is too weak',
              data: null,
              error: {
                code: HttpStatus.BAD_REQUEST,
                message:
                  'Password is too weak. Please choose a password with at least 6 characters.',
              },
            };
          default:
            return {
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message: 'Registration failed',
              data: null,
              error: {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Registration failed',
              },
            };
        }
      } else {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
          data: null,
          error: {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred',
          },
        };
      }
    }
  }

  /**
   * LOGIN METHOD
   // region LOGIN SERVICE 
   * @param param0 { email: String, token: String, provider: String }
   */
  async login({
    token,
    role = 'customer',
    provider = false,
  }: LoginDto): Promise<IApiResponse<IUnsafeObject>> {
    console.log('🚀 [AUTH SERVICE] Login attempt started');
    console.log('📋 [AUTH SERVICE] Login payload:', {
      hasToken: !!token,
      tokenLength: token?.length,
      role,
      provider,
    });

    try {
      let userRecord: any;

      // Role checked..
      const validRole = this.roleChecker(role);
      console.log('✅ [AUTH SERVICE] Role validation:', { role, validRole });

      if (validRole === false) {
        console.log('❌ [AUTH SERVICE] Invalid role detected:', role);
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid Role',
          data: null,
          error: {
            code: HttpStatus.UNAUTHORIZED,
            message: 'Invalid Role',
          },
        };
      }

      if (token && provider) {
        console.log('🔐 [AUTH SERVICE] Provider authentication flow started');
        console.log('🔍 [AUTH SERVICE] Verifying provider token...');

        userRecord = await this.verifyProviderToken(token, provider);
        console.log('✅ [AUTH SERVICE] Provider token verified:', {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        });

        // Check if user exists..
        console.log(
          '👤 [AUTH SERVICE] Checking if user exists in Firebase Auth...',
        );
        const authUser = await this.firebaseService
          .getAuth()
          .getUser(userRecord.uid);
        console.log('✅ [AUTH SERVICE] Firebase Auth user found:', {
          uid: authUser.uid,
          email: authUser.email,
        });

        // Check from DB also.. for existing user
        console.log(
          '🗄️ [AUTH SERVICE] Checking if user profile exists in Firestore...',
        );
        const dbUser = await this.firebaseService
          .getFirestore()
          .collection('profiles')
          .doc(userRecord.uid)
          .get();
        console.log('📊 [AUTH SERVICE] Firestore profile check:', {
          exists: dbUser.exists,
          uid: userRecord.uid,
        });

        if (authUser && dbUser.exists === false) {
          console.log(
            '📝 [AUTH SERVICE] User not found in Firestore, auto-registering...',
          );
          // Automatically register user if they don't exist..
          const registerResult = await this.register({
            name: userRecord.displayName,
            email: userRecord.email,
            password: '',
            token: token,
            role: role,
            provider: provider,
          });
          console.log('✅ [AUTH SERVICE] Auto-registration result:', {
            statusCode: registerResult.statusCode,
            message: registerResult.message,
          });
        }

        // Re-fetch the user record after registration..
        console.log(
          '🔄 [AUTH SERVICE] Re-fetching user record after registration...',
        );
        userRecord = await this.firebaseService
          .getAuth()
          .getUser(userRecord.uid);
        console.log('✅ [AUTH SERVICE] User record re-fetched successfully');
      } else {
        // The client should handle login with email/password..
        // We can also verify our user with token which is provided from client..
        // const user = await this.firebaseService.getAuth().getUserByEmail(email);
        const decodedToken = await this.verifyProviderToken(token, false);
        if (typeof decodedToken === 'object' && 'uid' in decodedToken) {
          const user = await this.firebaseService
            .getAuth()
            .getUser(decodedToken.uid);

          if (!user) {
            return {
              statusCode: HttpStatus.UNAUTHORIZED,
              message: 'Invalid credentials',
              data: null,
              error: {
                code: HttpStatus.UNAUTHORIZED,
                message: 'Invalid credentials',
              },
            };
          }

          userRecord = user;
        } else {
          return {
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'Invalid token',
            data: null,
            error: {
              code: HttpStatus.UNAUTHORIZED,
              message: 'Invalid token',
            },
          };
        }
      }

      // Generate a new id token..
      console.log('🎫 [AUTH SERVICE] Generating custom token for user...');
      const idToken = await this.generateToken(userRecord.uid, role);
      console.log('✅ [AUTH SERVICE] Custom token generated successfully');

      // verify role
      console.log(
        '🔍 [AUTH SERVICE] Fetching user profile for role verification...',
      );
      const userProfile = (
        await this.firebaseService
          .getFireStore()
          .collection(this.firebaseService.collections.profiles)
          .doc(userRecord.uid)
          .get()
      ).data();

      console.log('📋 [AUTH SERVICE] User profile data:', {
        profileExists: !!userProfile,
        profileRole: userProfile?.role,
        requestedRole: role,
        email: userProfile?.email,
      });

      if (userProfile?.role !== role) {
        console.log('❌ [AUTH SERVICE] Role mismatch detected:', {
          profileRole: userProfile?.role,
          requestedRole: role,
        });

        const errorMessage = `This email is already registered as a ${userProfile?.role}. Please login using the ${userProfile?.role} portal or contact support to change your role.`;

        return {
          statusCode: HttpStatus.CONFLICT,
          message: errorMessage,
          data: {
            existingRole: userProfile?.role,
            requestedRole: role,
            email: userProfile?.email,
            suggestion: `Try logging in as a ${userProfile?.role} instead`,
          },
          error: {
            code: HttpStatus.CONFLICT,
            message: errorMessage,
            extra: { type: 'ROLE_MISMATCH' },
          },
        };
      }

      console.log('🎉 [AUTH SERVICE] Login successful! Returning user data...');
      return {
        message: 'User logged in successfully',
        statusCode: HttpStatus.OK,
        data: {
          ...userProfile,
          userId: userRecord.uid,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          idToken,
        },
      };
    } catch (error) {
      console.log('💥 [AUTH SERVICE] Login error caught:', error);
      console.log('🔍 [AUTH SERVICE] Error details:', {
        message: (error as Error)?.message,
        code: (error as any)?.code,
        name: (error as Error)?.name,
        stack: (error as Error)?.stack?.substring(0, 200),
      });

      const firebaseError = error as FirebaseAuthError;

      if (firebaseError.code === 'auth/user-not-found') {
        console.log('❌ [AUTH SERVICE] User not found error');
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
          data: null,
          error: {
            code: HttpStatus.UNAUTHORIZED,
            message: 'Invalid credentials',
          },
        };
      }

      console.log('❌ [AUTH SERVICE] Unexpected error occurred');
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        data: null,
        error: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
        },
      };
    }
  }

  /**
   * EMAIL VERIFY ON DB MANUALLY FOR DB FIELD
   // region EMAIL VERIFY SERVICE
   * @param userId
   * @returns
   */
  async verifyUserProfileEmail(
    stateCode: string,
  ): Promise<IApiResponse<IUnsafeObject>> {
    try {
      const userRecord = await this.firebaseService
        .getAuth()
        .verifyIdToken(stateCode);

      if (!userRecord?.emailVerified) {
        // Update the isVerified field of firestore DB..
        await this.firebaseService
          .getFirestore()
          .collection('profiles')
          .doc(userRecord?.uid)
          .set({ isVerified: true }, { merge: true });

        return {
          message: 'Email verified successfully',
          statusCode: HttpStatus.OK,
          data: null,
          error: null,
        };
      } else {
        return {
          message: 'Email already verified, trying to login.',
          statusCode: HttpStatus.OK,
          data: null,
          error: null,
        };
      }
    } catch (error) {
      return {
        message: 'An error occurred while verifying email',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        error: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while verifying email',
        },
      };
    }
  }
}
