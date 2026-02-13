import { Injectable } from '@nestjs/common';
import { ServiceDto } from './dto/create-service.dto';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ServiceService {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * SERVICE CREATE SERVICE
   // region CREATE SERVICE
   * @param createServiceDto 
   * @returns 
   */
  async create(createServiceDto: ServiceDto) {
    try {
      const firestore = this.firebaseService.getFirestore();
      const serviceRef = firestore.collection('services').doc();
      const serviceId = serviceRef.id;

      // Prepare the service data
      const serviceData = {
        service_id: serviceId, // Use service_id to match the expected field
        ...createServiceDto,
        createdAt: new Date().toISOString(),
      };

      // Start a batch write
      const batch = firestore.batch();

      // Add the service document
      batch.set(serviceRef, serviceData);

      // We don't need to update doctor's profile anymore since we query services by createdBy

      // Commit the batch
      await batch.commit();

      return {
        message: 'Service created successfully',
        data: serviceData,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create service: ${error.message}`);
      } else {
        throw new Error('Failed to create service: Unknown error');
      }
    }
  }

  /**
   * Retrieves all services from Firestore
   // region GET ALL SERVICES
   * @returns A promise with the list of services
   */
  async findAll() {
    try {
      const servicesCollectionRef = this.firebaseService
        .getFirestore()
        .collection('services');

      const snapshot = await servicesCollectionRef.get();

      if (snapshot.empty) {
        return {
          message: 'No services found',
          data: [],
        };
      }

      const services = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          service_id: data.service_id || doc.id,
          name: data.name,
          duration: data.duration,
          price: data.price,
          description: data.description,
          createdBy: data.createdBy,
        };
      });

      return {
        message: 'Services retrieved successfully',
        data: services,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve services: ${error.message}`);
      } else {
        throw new Error('Failed to retrieve services: Unknown error');
      }
    }
  }

  /**
   * Retrieves all services created by a specific doctor
   // region GET SERVICES BY DOCTOR
   * @param doctorId The ID of the doctor
   * @returns A promise with the list of services created by the doctor
   */
  async findAllByDoctor(doctorId: string) {
    try {
      const servicesCollectionRef = this.firebaseService
        .getFirestore()
        .collection('services');

      // Filter services by the doctor who created them
      const snapshot = await servicesCollectionRef
        .where('createdBy', '==', doctorId)
        .get();

      if (snapshot.empty) {
        return {
          message: 'No services found for this doctor',
          data: [],
        };
      }

      const services = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          service_id: data.service_id || doc.id,
          name: data.name,
          duration: data.duration,
          price: data.price,
          description: data.description,
          createdBy: data.createdBy,
        };
      });

      return {
        message: 'Services retrieved successfully',
        data: services,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve services: ${error.message}`);
      } else {
        throw new Error('Failed to retrieve services: Unknown error');
      }
    }
  }

  /**
   * Get a single service by ID
   * @param id The service ID to find
   */
  async findOne(id: string) {
    try {
      console.log('Looking up service by ID:', id);

      const serviceRef = this.firebaseService
        .getFirestore()
        .collection('services')
        .doc(id);

      const serviceDoc = await serviceRef.get();

      console.log('Service lookup result:', {
        id,
        exists: serviceDoc.exists,
        hasData: !!serviceDoc.data(),
      });

      if (!serviceDoc.exists) {
        console.error(`Service with ID ${id} not found`);
        throw new Error(`Service with ID ${id} not found`);
      }

      const data = serviceDoc.data();
      const result = {
        message: 'Service retrieved successfully',
        data: {
          id: serviceDoc.id,
          service_id: data.service_id || serviceDoc.id,
          name: data.name,
          duration: data.duration,
          price: data.price,
          description: data.description,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
        },
      };

      console.log('Service retrieved successfully:', {
        id,
        name: result.data.name,
        service_id: result.data.service_id,
      });

      return result;
    } catch (error) {
      console.error('Service findOne error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve service: ${error.message}`);
      } else {
        throw new Error('Failed to retrieve service: Unknown error');
      }
    }
  }

  /**
   * Update service
   // region UPDATE SERVICE
   * @param id 
   * @param updateServiceDto 
   */
  async update(id: string, updateServiceDto: ServiceDto) {
    try {
      const serviceRef = this.firebaseService
        .getFirestore()
        .collection('services')
        .doc(id.toString());

      const serviceDoc = await serviceRef.get();

      if (!serviceDoc.exists) {
        throw new Error(`Service with ID ${id} not found`);
      }

      // Prepare the updated service data
      const updatedServiceData = {
        name: updateServiceDto.name,
        duration: updateServiceDto.duration,
        price: updateServiceDto.price,
        description: updateServiceDto.description,
        createdBy: updateServiceDto.createdBy,
        updatedAt: new Date().toISOString(),
      };

      // Update the service document
      await serviceRef.update(updatedServiceData);

      return {
        message: 'Service updated successfully',
        data: {
          id: serviceDoc.id,
          ...updatedServiceData,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update service: ${error.message}`);
      } else {
        throw new Error('Failed to update service: Unknown error');
      }
    }
  }

  /**
   * Delete service
   // region DELETE SERVICE
   * @param id 
   */
  async remove(id: string) {
    try {
      const serviceRef = this.firebaseService
        .getFirestore()
        .collection('services')
        .doc(id.toString());

      const serviceDoc = await serviceRef.get();

      if (!serviceDoc.exists) {
        throw new Error(`Service with ID ${id} not found`);
      }

      await serviceRef.delete();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to remove service: ${error.message}`);
      } else {
        throw new Error('Failed to remove service: Unknown error');
      }
    }
  }
}
