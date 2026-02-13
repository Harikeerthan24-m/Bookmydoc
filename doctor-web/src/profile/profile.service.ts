import { Injectable, HttpStatus } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { ProfileDto } from './dto/profile.dto';
import { IApiResponse, IUnsafeObject } from '@common/types';
import { classToPlain } from 'class-transformer';

interface IMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class ProfileService {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * GETTING THE SERVICES BY SERVICES IDs
   // region Services By Ids
   * @param serviceIds 
   */
  private async getServicesByIds(serviceIds: string[]): Promise<any[]> {
    const services = await this.firebaseService
      .getFirestore()
      .collection('services')
      .where(
        'service_id',
        'in',
        serviceIds.map((id) => id),
      )
      .get();
    return services.docs.map((doc) => doc.data());
  }

  /**
   * GET PROFILE DETAILS
   * @param userId
   * @returns
   */
  async getProfile(userId: string): Promise<IApiResponse<IUnsafeObject>> {
    try {
      const firestore = this.firebaseService.getFirestore();
      const profileDoc = await firestore
        .collection('profiles')
        .doc(userId)
        .get();

      if (!profileDoc.exists) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Profile not found',
          data: null,
        };
      }

      // Safely access profile data
      const profileData = profileDoc.data() || {};

      // Get services by their IDs
      const serviceIds = profileData.services || [];
      let services = [];
      if (serviceIds.length > 0) {
        services = await this.getServicesByIds(serviceIds);
      }

      // Construct the final profile data with services included
      const profileDataWithServices = {
        ...profileData,
        services,
        expertiseList: profileData.expertiseList || [],
      };

      return {
        message: 'Profile fetched successfully',
        statusCode: HttpStatus.OK,
        data: profileDataWithServices,
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        message: 'An error occurred while fetching the profile',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * UPDATE PROFILE DETAILS
   * @param userId
   * @param profileDto
   * @returns
   */
  async updateProfile(
    userId: string,
    profileDto: ProfileDto,
    file?: IMulterFile,
  ): Promise<IApiResponse<IUnsafeObject>> {
    try {
      let photoUrl = profileDto?.photoUrl;

      if (file && file !== undefined) {
        // Uplaoding image to firestore's root bucket..
        const bucket = this.firebaseService.getStorage().bucket();
        const fileName = `${userId}/${Date.now()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });

        // photoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
        const [downloadURL] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-09-3000',
        });

        photoUrl = downloadURL;
      }

      let updatedProfile = { ...profileDto };

      if (photoUrl) {
        updatedProfile = {
          ...profileDto,
          photoUrl,
        };
      }

      // Ensure profileDto.location is correctly formatted as an object
      if (profileDto.location && typeof profileDto.location === 'string') {
        try {
          updatedProfile.location = JSON.parse(profileDto.location);
        } catch (error) {
          console.error('Error parsing location:', error);
          throw new Error('Invalid location format');
        }
      }

      // expertiseList is already handled by the DTO Transform decorator
      if (profileDto.expertiseList) {
        updatedProfile.expertiseList = Array.isArray(profileDto.expertiseList)
          ? profileDto.expertiseList
          : [];
        console.log('Updated expertiseList:', updatedProfile.expertiseList);
      }

      if (profileDto.services && typeof profileDto.services === 'string') {
        try {
          updatedProfile.services = JSON.parse(profileDto.services);
        } catch (error) {
          console.error('Error parsing services:', error);
          throw new Error('Invalid services format');
        }
      }

      // Auto-calculate BMI if height and weight are provided
      if (profileDto.height && profileDto.weight) {
        // BMI = weight(kg) / height(m)^2
        const heightInMeters = profileDto.height / 100; // Convert cm to meters
        updatedProfile.bmi = Number(
          (profileDto.weight / (heightInMeters * heightInMeters)).toFixed(1),
        );
      }

      // Converted JavaScript Object to Plain Object for Firebase Firestore capable..
      const updatedProfilePlain = classToPlain(updatedProfile);

      if (
        profileDto?.notification_tokens &&
        profileDto?.notification_tokens !== ''
      ) {
        updatedProfilePlain.notification_tokens = FieldValue.arrayUnion(
          updatedProfilePlain?.notification_tokens,
        );
      } else {
        delete updatedProfilePlain?.notification_tokens;
      }

      await this.firebaseService
        .getFirestore()
        .collection('profiles')
        .doc(userId)
        .set(updatedProfilePlain, { merge: true });

      return {
        message: 'Profile updated successfully',
        statusCode: HttpStatus.OK,
        data: updatedProfilePlain as any,
      };
    } catch (error) {
      return {
        message: 'An error occurred while updating the profile',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        error: error as any,
      };
    }
  }
}
