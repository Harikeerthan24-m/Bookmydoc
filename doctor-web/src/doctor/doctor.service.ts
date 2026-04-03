import { FirebaseService } from '@app/firebase/firebase.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { v7 as uuidv7 } from 'uuid';
import { IRole } from '@app/common/types/type';
import { DoctorFilterDto } from './dto/filters.dto';
import { DoctorDto } from './dto/doctor.dto';
import { ServiceDto } from '@app/booking/dto/booking.dto';
import { AvailabilitySlot } from '@app/availability/dto/availability.dto';
import { IDay } from './type';

@Injectable()
export class DoctorService {
  constructor(private readonly firebaseService: FirebaseService) {}

  isFindFilterDoctor(data, filters) {
    // filter by availability
    if (filters?.availability && !data?.availability?.length) {
      return false;
    }

    // filter by name
    if (filters?.name) {
      const searchName = filters.name.trim().toLowerCase();
      const displayName = (data?.display_name || '').toLowerCase();
      const userName = (data?.user_name || '').toLowerCase();

      // Remove dr/doctor prefix for comparison
      const cleanSearchName = searchName
        .replace(/^(dr\.?|doctor)\s*/i, '')
        .trim();

      if (
        !displayName.includes(cleanSearchName) &&
        !userName.includes(cleanSearchName)
      ) {
        return false;
      }
    }

    // filter by location (city or address)
    if (filters?.location) {
      const searchLoc = filters.location.trim().toLowerCase();
      const city = (data?.location?.city || '').toLowerCase();
      const address = (data?.location?.address || '').toLowerCase();
      const state = (data?.location?.state || '').toLowerCase();

      if (
        !city.includes(searchLoc) &&
        !address.includes(searchLoc) &&
        !state.includes(searchLoc)
      ) {
        return false;
      }
    }

    // filter by gender
    if (filters?.gender) {
      const g = filters.gender.toLowerCase();
      const dg = (data?.gender || '').toLowerCase();

      // Flexible matching for m/male, f/female
      const isMaleSearch = g === 'm' || g === 'male';
      const isFemaleSearch = g === 'f' || g === 'female';
      const isMaleDoctor = dg === 'm' || dg === 'male';
      const isFemaleDoctor = dg === 'f' || dg === 'female';

      if (isMaleSearch && !isMaleDoctor) return false;
      if (isFemaleSearch && !isFemaleDoctor) return false;
      if (!isMaleSearch && !isFemaleSearch && dg !== g) return false;
    }

    // filter by expertise
    if (filters?.expertise && Array.isArray(data?.expertiseList)) {
      const requestedSpecialists = filters.expertise
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const hasExpertise = data.expertiseList.some((ex) => {
        const doctorExpertise = (ex || '').toLowerCase().trim();
        return requestedSpecialists.some(
          (req) =>
            doctorExpertise.includes(req) || req.includes(doctorExpertise),
        );
      });

      if (!hasExpertise) {
        return false;
      }
    }

    // filter by rating
    if (
      filters?.minRating &&
      (!data?.star_rating || data.star_rating < filters.minRating)
    ) {
      return false;
    }

    return true;
  }

  isFindSearchDoctor(data, filters) {
    if (!filters?.search) {
      return true;
    }

    const searchText = filters.search.trim().toLowerCase();
    const displayName = (data?.display_name || '').toLowerCase();
    const userName = (data?.user_name || '').toLowerCase();

    // Clean up search text (remove dr/doctor prefix)
    const cleanSearchText = searchText
      .replace(/^(dr\.?|doctor)\s*/i, '')
      .trim();

    // Search in all name fields
    if (
      displayName.includes(cleanSearchText) ||
      userName.includes(cleanSearchText)
    ) {
      return true;
    }

    // Search in expertise list with partial matching
    if (Array.isArray(data?.expertiseList)) {
      const hasExpertise = data.expertiseList.some((ex) => {
        const expertise = (ex || '').toLowerCase().trim();
        // Match start of words in expertise
        return expertise
          .split(/\s+/)
          .some((word) => word.startsWith(cleanSearchText));
      });
      if (hasExpertise) {
        return true;
      }
    }

    // Search in specializations
    if (Array.isArray(data?.specializations)) {
      const hasSpecialization = data.specializations.some((spec) => {
        const specialization = (spec || '').toLowerCase().trim();
        return specialization.includes(cleanSearchText);
      });
      if (hasSpecialization) {
        return true;
      }
    }

    return false;
  }

  async getDoctors(filters?: DoctorFilterDto, userRole: IRole = IRole.ADMIN) {
    const fireStore = this.firebaseService.getFireStore();

    // get doctors
    let doctorRef: any = fireStore.collection(
      this.firebaseService.collections.profiles,
    );
    doctorRef = doctorRef.where('role', '==', IRole.DOCTOR);

    // SERVER-SIDE FILTERING: Expertise (array-contains-any)
    if (filters?.expertise) {
      const expertiseArray = filters.expertise
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (expertiseArray.length > 0) {
        // Firestore limit: array-contains-any max 10 items
        doctorRef = doctorRef.where(
          'expertiseList',
          'array-contains-any',
          expertiseArray.slice(0, 10),
        );
      }
    }

    // SERVER-SIDE FILTERING: Gender
    if (filters?.gender) {
      // Normalize to 'Male' or 'Female' to match Firestore data which is case-sensitive
      const queryGender =
        filters.gender.toLowerCase() === 'male'
          ? 'Male'
          : filters.gender.toLowerCase() === 'female'
            ? 'Female'
            : filters.gender;
      doctorRef = doctorRef.where('gender', '==', queryGender);
    }

    // OPTIMIZATION: Apply limit early
    const maxFetch = filters?.limit ? Math.max(100, +filters.limit * 2) : 500;
    doctorRef = doctorRef.limit(maxFetch);

    const doctorSnapshot = await doctorRef.get();
    const doctorResults = [];

    for (const doc of doctorSnapshot.docs) {
      const data = doc.data() as DoctorDto;
      data.uid = doc.id; // Ensure UID is present for key extractor

      if (!this.isFindFilterDoctor(data, filters)) {
        continue;
      }

      if (!this.isFindSearchDoctor(data, filters)) {
        continue;
      }

      // Normalization
      if (!data?.availability) {
        data.availability = [];
      }
      if (data?.availabilitySlots) {
        try {
          if (typeof data.availabilitySlots === 'string') {
            data.availabilitySlots = JSON.parse(data.availabilitySlots);
          }
        } catch (error) {
          data.availabilitySlots = [];
        }
      }

      // Populate basic star rating if missing
      if (!data.star_rating) {
        if (Array.isArray(data?.ratings) && data?.ratings?.length) {
          const total_ratings = (data?.ratings).reduce((p, c) => +p + +c, 0);
          data.star_rating = +parseFloat(
            String(total_ratings / data?.ratings?.length),
          ).toFixed(2);
        } else {
          data.star_rating = 4.0;
        }
      }

      // NOTE: REMOVED services sub-query for performance.
      // Services are fetched lazily in getDoctorDetails.
      data.providingServices = [];

      if (userRole !== IRole.ADMIN) {
        delete data?.email;
        delete data?.phone;
        delete data?.notification_tokens;
      }
      doctorResults.push(data);
    }

    // Sort results by relevance if there's a search query
    if (filters?.search) {
      const searchText = filters.search.trim().toLowerCase();
      // Clean up search text (remove dr/doctor prefix) for better ranking
      const cleanSearch = searchText.replace(/^(dr\.?|doctor)\s*/i, '').trim();

      doctorResults.sort((a, b) => {
        const aDisplayName = (a?.display_name || '').toLowerCase();
        const bDisplayName = (b?.display_name || '').toLowerCase();
        const aCleanName = aDisplayName.replace(/^(dr\.?|doctor)\s*/i, '').trim();
        const bCleanName = bDisplayName.replace(/^(dr\.?|doctor)\s*/i, '').trim();

        // 1. Exact name matches (ignore title)
        if (aCleanName === cleanSearch && bCleanName !== cleanSearch) return -1;
        if (bCleanName === cleanSearch && aCleanName !== cleanSearch) return 1;

        // 2. Prefix name matches
        if (aCleanName.startsWith(cleanSearch) && !bCleanName.startsWith(cleanSearch)) return -1;
        if (bCleanName.startsWith(cleanSearch) && !aCleanName.startsWith(cleanSearch)) return 1;

        // 3. Match in expertise at word start
        const aExpertiseMatch = (a?.expertiseList || []).some(ex => ex.toLowerCase().split(/\s+/).some(w => w.startsWith(cleanSearch)));
        const bExpertiseMatch = (b?.expertiseList || []).some(ex => ex.toLowerCase().split(/\s+/).some(w => w.startsWith(cleanSearch)));
        if (aExpertiseMatch && !bExpertiseMatch) return -1;
        if (bExpertiseMatch && !aExpertiseMatch) return 1;

        // 4. Alphabetical by display name
        return aDisplayName.localeCompare(bDisplayName);
      });
    } else {
      // Default: Sort alphabetically by display name
      doctorResults.sort((a, b) => 
        (a?.display_name || '').localeCompare(b?.display_name || '')
      );
    }

    if (filters?.limit) {
      return doctorResults.slice(0, +filters.limit);
    }

    return doctorResults;
  }

  async getDoctorDetails(doctorId: string, userRole: IRole = IRole.ADMIN) {
    const fireStore = this.firebaseService.getFireStore();

    // get doctors
    const doctorData = (
      await fireStore
        .collection(this.firebaseService.collections.profiles)
        .doc(doctorId)
        .get()
    ).data() as DoctorDto;
    if (doctorData?.role !== IRole.DOCTOR) {
      throw new HttpException('invalid doctor', HttpStatus.BAD_REQUEST);
    }

    // Get services created by this doctor
    console.log('Fetching services for doctor:', doctorId);

    const servicesSnapshot = await fireStore
      .collection(this.firebaseService.collections.services)
      .where('createdBy', '==', doctorId)
      .get();

    if (servicesSnapshot.empty) {
      console.log('No services found for doctor:', doctorId);
      doctorData.providingServices = [];
    } else {
      doctorData.providingServices = servicesSnapshot.docs.map((doc) => {
        const serviceData = doc.data();
        const service: ServiceDto = {
          service_id: serviceData.service_id || doc.id,
          name: serviceData.name || '',
          description: serviceData.description || '',
          type: serviceData.type || '',
          price: serviceData.price || 0,
        };
        return service;
      });

      console.log('Services found for doctor:', {
        doctorId,
        serviceCount: doctorData.providingServices.length,
        services: doctorData.providingServices.map((s) => ({
          service_id: s.service_id,
          name: s.name,
          price: s.price,
        })),
      });
    }

    // We don't need services array anymore since we query by createdBy

    // get availability data
    const availabilityDays = {};
    const availabilitySnapshot = await fireStore
      .collection(this.firebaseService.collections.availability_slots)
      .where('uid', '==', doctorId)
      .get();
    doctorData.availabilitySlots = availabilitySnapshot.docs.map((doc) => {
      const data = doc?.data() as AvailabilitySlot;
      availabilityDays[data?.day] = data?.day;
      return data;
    });
    if (!doctorData?.availability) {
      doctorData.availability = Object.keys(availabilityDays) as IDay[];
    }

    // get ratings
    if (
      !doctorData.star_rating &&
      Array.isArray(doctorData?.ratings) &&
      doctorData?.ratings?.length
    ) {
      const ratings = (doctorData?.ratings).reduce((p, c) => +p + +c, 0);
      doctorData.star_rating = +parseFloat(
        String(ratings / doctorData?.ratings?.length),
      ).toFixed(2);
      doctorData.star_rating =
        doctorData.star_rating > 5 ? 5 : doctorData.star_rating;
    } else {
      doctorData.star_rating = Math.floor(Math.random() * 4);
      doctorData.ratings = [doctorData.star_rating];
    }

    if (userRole !== IRole.ADMIN) {
      delete doctorData?.email;
      delete doctorData?.phone;
      delete doctorData?.notification_tokens;
    }

    // get bookings
    const bookingsSnapshot = await fireStore
      .collection(this.firebaseService.collections.bookings)
      .where('doctor_id', '==', doctorId)
      .where('status', '==', 'completed')
      .limit(100)
      .get();
    const bookings = [];
    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc?.data();
      const bookingRefs = [];
      bookingRefs.push(booking?.customer ? booking.customer.get() : null);
      bookingRefs.push(booking?.service ? booking.service.get() : null);
      bookingRefs.push(booking?.slot ? booking.slot.get() : null);
      const refs = await Promise.all(bookingRefs);
      booking.customer = refs[0]?.exists ? refs[0]?.data() : {};
      booking.service = refs[1]?.exists ? refs[1]?.data() : {};
      booking.slot = refs[2]?.exists ? refs[2]?.data() : {};
      bookings.push(booking);
    }
    doctorData.bookings = bookings;

    return doctorData;
  }
}
