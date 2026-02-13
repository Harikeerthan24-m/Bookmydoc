import { FirebaseService } from '@app/firebase/firebase.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import Razorpay from 'razorpay';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
// import Stripe from 'stripe';
import { BookingFilterDto } from '@app/booking/dto/filters.dto';
import {
  BookingCreateDto,
  BookingUpdateDto,
  BookingDto,
} from '@app/booking/dto/booking.dto';
import { IUnsafeObject } from '@app/common/types';
import { IBookingStatus, IPaymentStatus } from './type';
import { CreatePaymentDto } from './dto/payment.dto';
import { IRole } from '@app/common/types/type';
import { FirebaseNotificationService } from '@app/firebase/firebase-notification.service';
import { ReviewDto } from './dto/review.dto';

@Injectable()
export class BookingService {
  // stripe: Stripe;
  logger: Logger;
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly firebaseNotification: FirebaseNotificationService,
  ) {
    // this.stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY));
    this.logger = new Logger(this.constructor.name);
  }

  private async getProfileData(userId: string) {
    const fireStore = this.firebaseService.getFireStore();
    const profileDoc = await fireStore
      .collection(this.firebaseService.collections.profiles)
      .doc(userId)
      .get();
    return profileDoc.data();
  }

  async getBookings(filters: BookingFilterDto, userRole: IRole = IRole.ADMIN) {
    const fireStore = this.firebaseService.getFireStore();
    let bookingsRef: any = fireStore.collection(
      this.firebaseService.collections.bookings,
    );

    let orderBy;
    if (['asc', 'desc'].includes(filters?.order_by)) {
      orderBy = filters?.order_by;
      delete filters.order_by;
    }

    if (filters) {
      for (const filter in filters) {
        bookingsRef = bookingsRef.where(filter, '==', filters[filter]);
      }
    }

    const bookingsDocs = await bookingsRef.get();

    const results = await Promise.all(
      bookingsDocs.docs.map(async (doc: any) => {
        const booking = doc.data();
        let doctor = null;
        if (booking?.doctor && userRole == IRole.CUSTOMER) {
          const doctorSnap = await booking.doctor.get();
          doctor = doctorSnap.data();
          if (userRole == IRole.CUSTOMER) {
            delete doctor?.email;
            delete doctor?.phone;
            delete doctor?.notification_tokens;
          }
        }
        let customer = null;
        if (booking?.customer && userRole == IRole.DOCTOR) {
          const customerSnap = await booking.customer.get();
          customer = customerSnap.data();
        }
        let service = null;
        if (booking?.service) {
          const serviceSnap = await booking.service.get();
          service = serviceSnap.data();
        }
        let slot = null;
        if (booking?.slot) {
          const slotSnap = await booking.slot.get();
          slot = slotSnap.data();
        }

        return {
          ...booking,
          doctor,
          customer,
          service,
          slot,
        };
      }),
    );

    if (orderBy) {
      return results.sort((a, b) => {
        if (orderBy === 'asc') {
          return new Date(a.date).getTime() - new Date(b?.date).getTime();
        }
        if (orderBy === 'desc') {
          return new Date(b.date).getTime() - new Date(a?.date).getTime();
        }
      });
    }

    return results;
  }

  async getSingleBooking(
    bookingId: string,
    filters: BookingFilterDto = {},
    userRole: IRole = IRole.ADMIN,
  ) {
    const fireStore = this.firebaseService.getFireStore();
    const bookingsDocs: any = await fireStore
      .collection(this.firebaseService.collections.bookings)
      .doc(bookingId)
      .get();

    if (!bookingsDocs?.exists) {
      throw new HttpException('No booking found', HttpStatus.BAD_REQUEST);
    }

    const booking = bookingsDocs.data();

    if (
      (filters.customer_id && booking?.customer_id !== filters.customer_id) ||
      (filters.doctor_id && booking?.doctor_id !== filters.doctor_id)
    ) {
      throw new HttpException('Invalid booking', HttpStatus.BAD_REQUEST);
    }

    let doctor = null;
    if (booking?.doctor && userRole == IRole.CUSTOMER) {
      const doctorSnap = await booking.doctor.get();
      doctor = doctorSnap.data();
      if (userRole == IRole.CUSTOMER) {
        delete doctor?.email;
        delete doctor?.phone;
        delete doctor?.notification_tokens;
      }
    }
    let customer = null;
    if (booking?.customer && userRole == IRole.DOCTOR) {
      const customerSnap = await booking.customer.get();
      customer = customerSnap.data();
    }
    let service = null;
    if (booking?.service) {
      const serviceSnap = await booking.service.get();
      service = serviceSnap.data();
    }
    let slot = null;
    if (booking?.slot) {
      const slotSnap = await booking.slot.get();
      slot = slotSnap.data();
    }

    return {
      ...booking,
      doctor,
      customer,
      service,
      slot,
    };
  }

  async createBooking(payload: BookingCreateDto, user: any) {
    const fireStore = this.firebaseService.getFireStore();

    const profile = (
      await fireStore
        .collection(this.firebaseService.collections.profiles)
        .doc(payload?.customer_id)
        .get()
    ).data();

    if (!profile?.uid) {
      throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);
    }

    const service = (
      await fireStore
        .collection(this.firebaseService.collections.services)
        .doc(payload?.service_id)
        .get()
    ).data();
    if (!service?.service_id) {
      throw new HttpException('Service not found', HttpStatus.BAD_REQUEST);
    }

    const doctor = (
      await fireStore
        .collection(this.firebaseService.collections.profiles)
        .doc(payload?.doctor_id)
        .get()
    ).data();

    if (!doctor?.uid) {
      throw new HttpException('Doctor not found', HttpStatus.BAD_REQUEST);
    }

    // Format date as ISO 8601 string with time
    const payloadDate = new Date(payload?.date);
    const bookingDate = payloadDate.toISOString();
    let paymentStatus =
      user?.role === IRole.ADMIN && payload?.payment?.status
        ? payload?.payment?.status
        : IPaymentStatus.PENDING;

    if (
      user?.role !== IRole.ADMIN &&
      (payload?.payment?.transaction_id || payload?.payment?.order_id)
    ) {
      const validPayment = validatePaymentVerification(
        {
          order_id: payload?.payment?.order_id,
          payment_id: payload?.payment?.transaction_id,
        },
        payload?.payment?.signature,
        process.env.RAZORPAY_API_SECRET,
      );
      if (!validPayment) {
        throw new HttpException(
          'Payment verification failed',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      paymentStatus = IPaymentStatus.COMPLETED;
    }

    const createPayload = {
      booking_id: uuidv7(),
      customer_id: payload?.customer_id,
      doctor_id: payload?.doctor_id,
      date: bookingDate,
      service_id: payload?.service_id,
      slot_id: payload?.slot_id,
      status: 'confirmed',
      payment: {
        ephemeralId: payload?.payment?.ephemeralId || '',
        transaction_id: payload?.payment?.transaction_id || '',
        order_id: payload?.payment?.order_id || '',
        signature: payload?.payment?.signature || '',
        amount:
          user?.role === IRole.ADMIN && payload?.payment?.amount
            ? payload?.payment?.amount
            : service?.price || 0,
        status: paymentStatus,
      },
      history: {
        created_at: new Date().toISOString(),
        created_by: user?.uid,
        created_by_role: user?.role,
        created_by_name: user?.name,
        confirmed_at: '',
        confirmed_by: '',
        confirmed_by_role: '',
        confirmed_by_name: '',
        canceled_at: '',
        canceled_by: '',
        canceled_by_role: '',
        canceled_by_name: '',
        completed_at: '',
        completed_by: '',
        completed_by_role: '',
        completed_by_name: '',
      },
    } as IUnsafeObject<any>;

    if (createPayload?.doctor_id) {
      createPayload.doctor = fireStore.doc(
        `${this.firebaseService.collections.profiles}/${createPayload?.doctor_id}`,
      );
    }

    if (createPayload?.customer_id) {
      createPayload.customer = fireStore.doc(
        `${this.firebaseService.collections.profiles}/${createPayload?.customer_id}`,
      );
    }

    if (createPayload?.slot_id) {
      createPayload.slot = fireStore.doc(
        `${this.firebaseService.collections.availability_slots}/${createPayload?.slot_id}`,
      );
    }

    if (createPayload?.service_id) {
      createPayload.service = fireStore.doc(
        `${this.firebaseService.collections.services}/${createPayload?.service_id}`,
      );
    }

    createPayload.created_at = new Date().toISOString();

    await fireStore
      .collection(this.firebaseService.collections.bookings)
      .doc(createPayload.booking_id)
      .create(createPayload);

    this.logger.log(createPayload, 'Booking Created');

    // Get service data
    const serviceDoc = await fireStore
      .collection(this.firebaseService.collections.services)
      .doc(createPayload.service_id)
      .get();
    const serviceData = serviceDoc.data();

    // Prepare notification data for doctor
    const doctorNotificationData = this.prepareBookingNotification(
      await this.getProfileData(createPayload.doctor_id),
      await this.getProfileData(createPayload.customer_id),
      createPayload,
      {},
    );

    // Prepare notification data for customer
    const customerNotificationData = this.prepareBookingNotification(
      await this.getProfileData(createPayload.customer_id),
      await this.getProfileData(createPayload.doctor_id),
      createPayload,
      {},
    );

    // Store notification for doctor
    await fireStore.collection('notifications').add({
      notification: {
        title: 'New Appointment',
        body:
          doctorNotificationData.notification.body ||
          'A new appointment has been booked',
      },
      type: 'booking_created',
      read: false,
      receiver: {
        uid: createPayload.doctor_id,
        name:
          (await this.getProfileData(createPayload.doctor_id))?.user_name ||
          'Doctor',
        role: 'doctor',
      },
      sender: {
        uid: createPayload.customer_id,
        name:
          (await this.getProfileData(createPayload.customer_id))?.user_name ||
          'Patient',
        role: 'customer',
      },
      context: {
        booking_id: createPayload.booking_id,
        payment_id: createPayload.payment?.transaction_id || '',
        amount: createPayload.payment?.amount || 0,
        service_name: serviceData?.name || 'Consultation',
        date: createPayload.date || new Date().toISOString(),
        actions: ['confirm', 'reschedule', 'cancel'],
        type: 'booking_created',
      },
      createdAt: new Date().toISOString(),
    });

    // Store notification for customer
    await fireStore.collection('notifications').add({
      notification: {
        title: 'Appointment Booked',
        body:
          customerNotificationData.notification.body ||
          'Your appointment has been created',
      },
      type: 'booking_created',
      read: false,
      receiver: {
        uid: createPayload.customer_id,
        name:
          (await this.getProfileData(createPayload.customer_id))?.user_name ||
          'Patient',
        role: 'customer',
      },
      sender: {
        uid: createPayload.doctor_id,
        name:
          (await this.getProfileData(createPayload.doctor_id))?.user_name ||
          'Doctor',
        role: 'doctor',
      },
      context: {
        booking_id: createPayload.booking_id,
        payment_id: createPayload.payment?.transaction_id || '',
        amount: createPayload.payment?.amount || 0,
        service_name: serviceData?.name || 'Consultation',
        date: createPayload.date || new Date().toISOString(),
        actions: ['view_booking'],
        type: 'booking_created',
      },
      createdAt: new Date().toISOString(),
    });

    // Send FCM notifications to both parties
    try {
      // Send to doctor
      await this.firebaseNotification.sendNotificationByToken(
        createPayload.doctor_id,
        createPayload.customer_id,
        () => doctorNotificationData,
      );

      // Send to customer
      await this.firebaseNotification.sendNotificationByToken(
        createPayload.customer_id,
        createPayload.doctor_id,
        () => customerNotificationData,
      );
    } catch (error) {
      this.logger.error(`FCM notification failed: ${error}`, 'FCM Error');
    }

    return true;
  }

  async updateBooking(
    bookingId: string,
    filters: BookingFilterDto,
    payload: BookingUpdateDto,
    user: any,
  ) {
    const fireStore = this.firebaseService.getFireStore();
    const bookingsDocs = await fireStore
      .collection(this.firebaseService.collections.bookings)
      .doc(bookingId)
      .get();

    if (!bookingsDocs?.exists) {
      throw new HttpException('No booking found', HttpStatus.BAD_REQUEST);
    }
    const bookingData = bookingsDocs.data() as BookingDto;

    if (
      (filters?.doctor_id && filters?.doctor_id !== bookingData.doctor_id) ||
      (filters?.customer_id && filters?.customer_id !== bookingData.customer_id)
    ) {
      throw new HttpException('Invalid booking', HttpStatus.BAD_REQUEST);
    }

    if (
      bookingData?.status == IBookingStatus.COMPLETED &&
      [IRole.CUSTOMER, IRole.DOCTOR].includes(user?.role)
    ) {
      throw new HttpException(
        `Its already ${IBookingStatus.COMPLETED}. So you can not updated it.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user?.role === IRole.CUSTOMER &&
      payload.status == IBookingStatus.CANCELED &&
      bookingData?.status == IBookingStatus.CANCELED
    ) {
      throw new HttpException(
        `Its already ${IBookingStatus.CANCELED}. So you can not ${IBookingStatus.CANCELED} it again.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatePayload = {
      date: payload?.date
        ? new Date(payload.date).toISOString()
        : bookingData?.date,
      service_id: payload?.service_id || bookingData?.service_id,
      slot_id: payload?.slot_id || bookingData?.slot_id,
      status: payload?.status || bookingData?.status,
    } as IUnsafeObject;

    if (payload?.payment) {
      updatePayload.payment = {
        transaction_id:
          user?.role === IRole.ADMIN && payload?.payment?.transaction_id
            ? payload?.payment?.transaction_id
            : bookingData?.payment?.transaction_id || '',
        amount:
          user?.role === IRole.ADMIN && payload?.payment?.amount
            ? payload?.payment?.amount
            : bookingData?.payment?.amount || 0,
        status:
          user?.role === IRole.ADMIN && payload?.payment?.status
            ? payload?.payment?.status
            : bookingData?.payment?.status || IPaymentStatus.PENDING,
      };
    }

    const history = bookingData?.history || {};
    if (payload?.status && payload?.status == IBookingStatus.CONFIRMED) {
      updatePayload.history = {
        ...history,
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.uid,
        confirmed_by_role: user?.role,
        confirmed_by_name: user?.name,
      };
    }
    if (payload?.status && payload?.status == IBookingStatus.CANCELED) {
      updatePayload.history = {
        ...history,
        canceled_at: new Date().toISOString(),
        canceled_by: user?.uid,
        canceled_by_role: user?.role,
        canceled_by_name: user?.name,
      };
    }
    if (payload?.status && payload?.status == IBookingStatus.COMPLETED) {
      updatePayload.history = {
        ...history,
        completed_at: new Date().toISOString(),
        completed_by: user?.uid,
        completed_by_role: user?.role,
        completed_by_name: user?.name,
      };
    }

    // Handle reschedule requests with approval workflow
    if (payload?.date || payload?.slot_id) {
      // Get doctor's availability slots
      const doctorDoc = await fireStore
        .collection(this.firebaseService.collections.profiles)
        .doc(bookingData.doctor_id)
        .get();

      const doctorData = doctorDoc.data();

      // Parse availabilitySlots if it's stored as a string
      let availabilitySlots = [];
      try {
        if (typeof doctorData?.availabilitySlots === 'string') {
          availabilitySlots = JSON.parse(doctorData.availabilitySlots);
        } else if (Array.isArray(doctorData?.availabilitySlots)) {
          availabilitySlots = doctorData.availabilitySlots;
        }
      } catch (e) {
        this.logger.error('Failed to parse availability slots', e);
      }

      // Get the day of week for the new date
      const newDate = payload?.date
        ? new Date(payload.date)
        : new Date(bookingData.date);
      const dayOfWeek = newDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();

      // Check if the doctor has slots on this day
      const hasSlotOnDay =
        Array.isArray(availabilitySlots) &&
        availabilitySlots.some(
          (slot) => slot?.day?.toLowerCase() === dayOfWeek,
        );

      if (!hasSlotOnDay) {
        throw new HttpException(
          'No availability slots found for selected date',
          HttpStatus.BAD_REQUEST,
        );
      }

      // If slot_id is provided, validate it exists
      if (payload?.slot_id) {
        const slotDoc = await fireStore
          .collection(this.firebaseService.collections.availability_slots)
          .doc(payload.slot_id)
          .get();

        if (!slotDoc.exists) {
          throw new HttpException(
            'Selected slot is not available',
            HttpStatus.BAD_REQUEST,
          );
        }

        updatePayload.slot = fireStore.doc(
          `${this.firebaseService.collections.availability_slots}/${payload.slot_id}`,
        );
      }

      // Determine if this is a reschedule request that needs approval
      const isPatientRescheduling =
        user?.role === 'customer' || user?.uid === bookingData.customer_id;
      const isDoctorRescheduling =
        user?.role === 'doctor' || user?.uid === bookingData.doctor_id;

      if (isPatientRescheduling) {
        // Patient is requesting reschedule - set to pending approval
        updatePayload.status = IBookingStatus.RESCHEDULE_PENDING;
        updatePayload.reschedule_request = {
          requested_by: user?.uid,
          requested_at: new Date().toISOString(),
          requested_date: payload?.date || bookingData.date,
          requested_slot_id: payload?.slot_id || bookingData.slot_id,
          original_date: bookingData.date,
          original_slot_id: bookingData.slot_id,
        };

        // Don't update the actual date/slot until doctor approves
        delete updatePayload.date;
        delete updatePayload.slot_id;
        delete updatePayload.slot;
      } else if (
        isDoctorRescheduling &&
        bookingData.status === IBookingStatus.RESCHEDULE_PENDING
      ) {
        // Doctor is responding to reschedule request
        if (payload?.approve_reschedule === true) {
          this.logger.log(
            'RESCHEDULE APPROVED: Applying requested changes',
            'Reschedule Decision',
          );
          // Doctor approved - apply the requested changes
          updatePayload.status = IBookingStatus.CONFIRMED;
          updatePayload.date = bookingData.reschedule_request?.requested_date;
          updatePayload.slot_id =
            bookingData.reschedule_request?.requested_slot_id;
          updatePayload.reschedule_approved = {
            approved_by: user?.uid,
            approved_at: new Date().toISOString(),
          };
          this.logger.log(
            `Approval details: ${JSON.stringify(updatePayload.reschedule_approved)}`,
            'Reschedule Approved',
          );
          delete updatePayload.reschedule_request;
        } else if (payload?.reject_reschedule === true) {
          this.logger.log(
            'RESCHEDULE REJECTED: Reverting to original appointment',
            'Reschedule Decision',
          );
          // Doctor rejected - revert to confirmed with original details
          updatePayload.status = IBookingStatus.CONFIRMED;
          updatePayload.reschedule_rejected = {
            rejected_by: user?.uid,
            rejected_at: new Date().toISOString(),
            rejection_reason: payload?.rejection_reason || 'No reason provided',
          };
          this.logger.log(
            `Rejection details: ${JSON.stringify(updatePayload.reschedule_rejected)}`,
            'Reschedule Rejected',
          );
          delete updatePayload.reschedule_request;
        }
      }
    }

    if (payload?.service_id) {
      const serviceDoc = await fireStore
        .collection(this.firebaseService.collections.services)
        .doc(payload.service_id)
        .get();

      if (!serviceDoc.exists) {
        throw new HttpException(
          'Selected service is not available',
          HttpStatus.BAD_REQUEST,
        );
      }

      updatePayload.service = fireStore.doc(
        `${this.firebaseService.collections.services}/${updatePayload?.service_id}`,
      );
    }

    updatePayload.updated_at = new Date().toISOString();

    await fireStore
      .collection(this.firebaseService.collections.bookings)
      .doc(bookingData?.booking_id)
      .set(updatePayload, { merge: true });

    this.logger.log(updatePayload, 'Booking Updated');

    // Determine who to notify based on who made the change
    let receiverId, senderId;

    this.logger.log(
      `User making update: ${JSON.stringify({ uid: user?.uid, role: user?.role, name: user?.name })}`,
      'Update User Info',
    );
    this.logger.log(
      `Booking data: ${JSON.stringify({ customer_id: bookingData.customer_id, doctor_id: bookingData.doctor_id })}`,
      'Booking Info',
    );

    if (user?.role === 'doctor' || user?.uid === bookingData.doctor_id) {
      // Doctor is updating, notify customer
      receiverId = bookingData.customer_id;
      senderId = bookingData.doctor_id;
      this.logger.log(
        'Notifying customer (doctor made update)',
        'Notification Direction',
      );
    } else {
      // Customer is updating, notify doctor
      receiverId = bookingData.doctor_id;
      senderId = bookingData.customer_id;
      this.logger.log(
        'Notifying doctor (customer made update)',
        'Notification Direction',
      );
    }

    // Get profile data
    const receiverProfile = await this.getProfileData(receiverId);
    const senderProfile = await this.getProfileData(senderId);

    this.logger.log(
      `Receiver profile: ${JSON.stringify({ uid: receiverProfile?.uid, user_name: receiverProfile?.user_name, role: receiverProfile?.role })}`,
      'Receiver Info',
    );
    this.logger.log(
      `Sender profile: ${JSON.stringify({ uid: senderProfile?.uid, user_name: senderProfile?.user_name, role: senderProfile?.role })}`,
      'Sender Info',
    );

    // Prepare notification data
    const notificationData = this.prepareBookingNotification(
      receiverProfile,
      senderProfile,
      updatePayload,
      bookingData,
    );

    this.logger.log(
      `Notification data: ${JSON.stringify(notificationData)}`,
      'Notification Data',
    );

    // Get service data
    const serviceDoc = await fireStore
      .collection(this.firebaseService.collections.services)
      .doc(
        (updatePayload.service_id as string) ||
          (bookingData.service_id as string),
      )
      .get();
    const serviceData = serviceDoc.data();

    // Store notification in Firestore for the receiver
    await fireStore.collection('notifications').add({
      notification: {
        title: 'Appointment Update',
        body:
          notificationData.notification.body ||
          'Your appointment has been updated',
      },
      type: notificationData.context.type || 'booking_updated',
      read: false,
      receiver: {
        uid: receiverId,
        name:
          (await this.getProfileData(receiverId))?.user_name ||
          (user?.role === 'doctor' ? 'Patient' : 'Doctor'),
        role: user?.role === 'doctor' ? 'customer' : 'doctor',
      },
      sender: {
        uid: senderId,
        name:
          (await this.getProfileData(senderId))?.user_name ||
          (user?.role === 'doctor' ? 'Doctor' : 'Patient'),
        role: user?.role || 'customer',
      },
      context: {
        booking_id: bookingData.booking_id,
        payment_id:
          (updatePayload.payment as any)?.transaction_id ||
          (bookingData.payment as any)?.transaction_id ||
          '',
        amount:
          (updatePayload.payment as any)?.amount ||
          (bookingData.payment as any)?.amount ||
          0,
        service_name: serviceData?.name || 'Consultation',
        date:
          updatePayload.date || bookingData.date || new Date().toISOString(),
        actions: notificationData.context.actions || ['view_booking'],
        type: notificationData.context.type || 'booking_updated',
      },
      createdAt: new Date().toISOString(),
    });

    // Send FCM notification to primary receiver
    try {
      await this.firebaseNotification.sendNotificationByToken(
        receiverId,
        senderId,
        () => notificationData,
      );
      this.logger.log(
        `FCM notification sent to primary receiver ${receiverId}`,
        'FCM Success',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send FCM notification to primary receiver ${receiverId}: ${error instanceof Error ? error.message : String(error)}`,
        'FCM Error',
      );
    }

    // Also send notification to the other party (if status changed)
    // But skip for reschedule pending requests to avoid duplicates
    // Exception: Always notify patient when doctor approves/rejects reschedule
    const isRescheduleDecision =
      payload?.approve_reschedule === true ||
      payload?.reject_reschedule === true;
    if (
      (bookingData?.status !== updatePayload.status &&
        updatePayload.status !== IBookingStatus.RESCHEDULE_PENDING) ||
      isRescheduleDecision
    ) {
      const otherPartyId =
        user?.role === 'doctor'
          ? bookingData.customer_id
          : bookingData.doctor_id;
      const otherPartyNotificationData = this.prepareBookingNotification(
        await this.getProfileData(otherPartyId),
        await this.getProfileData(senderId),
        { ...bookingData, ...updatePayload },
        bookingData,
      );

      await fireStore.collection('notifications').add({
        notification: {
          title: 'Appointment Status Update',
          body:
            otherPartyNotificationData.notification.body ||
            'Your appointment status has been updated',
        },
        type: 'booking_status_updated',
        read: false,
        receiver: {
          uid: otherPartyId,
          name:
            (await this.getProfileData(otherPartyId))?.user_name ||
            (user?.role === 'doctor' ? 'Patient' : 'Doctor'),
          role: user?.role === 'doctor' ? 'customer' : 'doctor',
        },
        sender: {
          uid: senderId,
          name:
            (await this.getProfileData(senderId))?.user_name ||
            (user?.role === 'doctor' ? 'Doctor' : 'Patient'),
          role: user?.role || 'customer',
        },
        context: {
          booking_id: bookingData.booking_id,
          payment_id:
            (updatePayload.payment as any)?.transaction_id ||
            (bookingData.payment as any)?.transaction_id ||
            '',
          amount:
            (updatePayload.payment as any)?.amount ||
            (bookingData.payment as any)?.amount ||
            0,
          service_name: serviceData?.name || 'Consultation',
          date:
            updatePayload.date || bookingData.date || new Date().toISOString(),
          actions: otherPartyNotificationData.context.actions || [
            'view_booking',
          ],
          type: 'booking_status_updated',
        },
        createdAt: new Date().toISOString(),
      });

      // Send FCM notification to the other party
      try {
        await this.firebaseNotification.sendNotificationByToken(
          otherPartyId,
          senderId,
          () => otherPartyNotificationData,
        );
        this.logger.log(
          `FCM notification sent to ${otherPartyId} about booking update`,
          'FCM Success',
        );
      } catch (error) {
        this.logger.error(
          `Failed to send FCM notification to ${otherPartyId}: ${error instanceof Error ? error.message : String(error)}`,
          'FCM Error',
        );
      }
    }

    // Also create a confirmation notification for the sender (doctor/customer who made the change)
    if (user?.role === 'doctor') {
      // Doctor made the change, create confirmation notification for doctor

      await fireStore.collection('notifications').add({
        notification: {
          title: 'Action Confirmation',
          body: `You ${updatePayload.date !== bookingData.date ? 'rescheduled' : 'updated'} the appointment for ${(await this.getProfileData(receiverId))?.user_name}`,
        },
        type: 'action_confirmation',
        read: false,
        receiver: {
          uid: senderId, // Doctor receives confirmation
          name: (await this.getProfileData(senderId))?.user_name || 'Doctor',
          role: 'doctor',
        },
        sender: {
          uid: senderId, // Doctor is sender of confirmation
          name: (await this.getProfileData(senderId))?.user_name || 'Doctor',
          role: 'doctor',
        },
        context: {
          booking_id: bookingData.booking_id,
          payment_id:
            (updatePayload.payment as any)?.transaction_id ||
            (bookingData.payment as any)?.transaction_id ||
            '',
          amount:
            (updatePayload.payment as any)?.amount ||
            (bookingData.payment as any)?.amount ||
            0,
          service_name: serviceData?.name || 'Consultation',
          date:
            updatePayload.date || bookingData.date || new Date().toISOString(),
          actions: ['view_booking'],
          type: 'action_confirmation',
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Send FCM notification
    this.logger.log(
      `Sending FCM notification to: ${receiverId} from: ${senderId}`,
      'FCM Notification',
    );
    try {
      await this.firebaseNotification.sendNotificationByToken(
        receiverId,
        senderId,
        () => notificationData,
      );
      this.logger.log('FCM notification sent successfully', 'FCM Success');
    } catch (error) {
      this.logger.error(
        `FCM notification failed: ${(error as Error).message}`,
        'FCM Error',
      );
    }

    return true;
  }

  async addBookingReview(
    bookingId: string,
    filters: BookingFilterDto,
    payload: ReviewDto,
    user: any,
  ) {
    const fireStore = this.firebaseService.getFireStore();
    const bookingsDocs = await fireStore
      .collection(this.firebaseService.collections.bookings)
      .doc(bookingId)
      .get();

    if (!bookingsDocs?.exists) {
      throw new HttpException('No booking found', HttpStatus.NOT_FOUND);
    }
    const bookingData = bookingsDocs.data() as BookingDto;

    if (
      (filters?.doctor_id && filters?.doctor_id !== bookingData.doctor_id) ||
      (filters?.customer_id && filters?.customer_id !== bookingData.customer_id)
    ) {
      throw new HttpException('Invalid booking', HttpStatus.BAD_REQUEST);
    }

    if (bookingData?.status !== IBookingStatus.COMPLETED) {
      throw new HttpException(
        `Its not ${IBookingStatus.COMPLETED}. So you can not review it.`,
        HttpStatus.MISDIRECTED,
      );
    }

    if (bookingData?.review?.datetime && user?.role === IRole.CUSTOMER) {
      throw new HttpException(
        `Your already rated it. So you can not rate again.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!payload?.comment && !payload?.rating) {
      throw new HttpException(
        'Review or Ratting is required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatePayload = {
      review: {
        comment: payload?.comment,
        rating: payload?.rating,
        datetime: new Date().toISOString(),
      },
    } as IUnsafeObject;

    await fireStore
      .collection(this.firebaseService.collections.bookings)
      .doc(bookingData?.booking_id)
      .set(updatePayload, { merge: true });

    const doctorDocs = await fireStore
      .collection(this.firebaseService.collections.profiles)
      .doc(bookingData.doctor_id)
      .get();

    if (doctorDocs?.exists) {
      const doctorProfile = doctorDocs.data();
      const ratingsData = Array.isArray(doctorProfile?.ratings)
        ? doctorProfile?.ratings
        : [];
      ratingsData.push(payload?.rating);

      // Calculate average rating
      const totalRatings = ratingsData.length;
      const sumRatings = ratingsData.reduce((sum, rating) => sum + rating, 0);
      const averageRating =
        totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : '0';

      await fireStore
        .collection(this.firebaseService.collections.profiles)
        .doc(bookingData.doctor_id)
        .set(
          {
            ratings: ratingsData,
            total_ratings: totalRatings,
            average_rating: parseFloat(averageRating),
          },
          { merge: true },
        );
    }

    this.logger.log('Booking Rated', updatePayload);
    return true;
  }

  prepareBookingNotification(
    receiver: IUnsafeObject<any>,
    sender: IUnsafeObject<any>,
    currentData: IUnsafeObject<any> = {},
    oldData: IUnsafeObject<any> = {},
  ) {
    currentData = {
      ...oldData,
      ...currentData,
    };
    let actions = [];
    if (currentData?.status === IBookingStatus.CONFIRMED) {
      actions = ['reschedule', 'cancel'];
    }
    if (currentData?.status === IBookingStatus.CANCELED) {
      actions = ['reschedule'];
    }
    if (currentData?.status === IBookingStatus.COMPLETED) {
      actions = ['rate'];
    }
    if (currentData?.status === IBookingStatus.RESCHEDULE_PENDING) {
      // For doctor: show approve/reject actions
      // For patient: show cancel action only
      actions =
        receiver?.role === 'doctor'
          ? ['approve_reschedule', 'reject_reschedule']
          : ['cancel'];
    } else if (
      currentData?.reschedule_approved ||
      currentData?.reschedule_rejected
    ) {
      // For reschedule decisions, just show view action
      actions = ['view_booking'];
    }

    // Format date for display (e.g., "Aug 23, 2025")
    const formatDate = (dateStr) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch (err) {
        return dateStr;
      }
    };

    let body = '';

    // Check if it's a reschedule PENDING first (this takes priority)
    if (currentData?.status === IBookingStatus.RESCHEDULE_PENDING) {
      if (receiver?.role === 'doctor') {
        body = `${sender?.user_name} has requested to reschedule their appointment to ${formatDate(currentData?.reschedule_request?.requested_date)}. Please approve or reject this request.`;
      } else {
        body = `Your reschedule request for ${formatDate(currentData?.reschedule_request?.requested_date)} is pending doctor approval.`;
      }
    }
    // Check for reschedule approval/rejection (new logic)
    else if (currentData?.reschedule_approved) {
      if (receiver?.role === 'customer') {
        body = `Dr. ${sender?.user_name} approved your reschedule request. Your appointment is now confirmed for ${formatDate(currentData?.date)}.`;
      } else {
        body = `You approved the reschedule request for ${sender?.user_name}.`;
      }
    } else if (currentData?.reschedule_rejected) {
      if (receiver?.role === 'customer') {
        body = `Dr. ${sender?.user_name} rejected your reschedule request. Your original appointment time remains: ${formatDate(oldData?.date)}. Reason: ${currentData?.reschedule_rejected?.rejection_reason}`;
      } else {
        body = `You rejected the reschedule request for ${sender?.user_name}.`;
      }
    }
    // Check if it's a regular reschedule (date or slot changed) - only if oldData has actual data and NOT pending
    else if (
      oldData?.date &&
      oldData?.slot_id && // Only check if oldData has actual booking data
      (oldData?.date !== currentData.date ||
        oldData?.slot_id !== currentData.slot_id)
    ) {
      // Determine who initiated the reschedule based on sender role
      if (receiver?.role === 'customer') {
        // Doctor rescheduled, customer receives notification
        body = `Dr. ${sender?.user_name} rescheduled your appointment to ${formatDate(currentData?.date)}`;
      } else {
        // Customer rescheduled, doctor receives notification
        body = `${sender?.user_name} rescheduled their appointment to ${formatDate(currentData?.date)}`;
      }
    }
    // Check if status changed (but not for new bookings)
    else if (oldData?.status && oldData?.status !== currentData.status) {
      switch (currentData.status) {
        case IBookingStatus.COMPLETED:
          if (receiver?.role === 'customer') {
            body = `Your appointment with Dr. ${sender?.user_name} has been completed`;
          } else {
            body = `Appointment with ${sender?.user_name} has been completed`;
          }
          break;

        case IBookingStatus.CONFIRMED:
          if (receiver?.role === 'doctor') {
            body = `${sender?.user_name} booked an appointment with you for ${formatDate(currentData?.date)}`;
          } else {
            body = `Your appointment with Dr. ${sender?.user_name} for ${formatDate(currentData?.date)} has been confirmed`;
          }
          break;
        case IBookingStatus.CANCELED:
          if (receiver?.role === 'customer') {
            body = `Dr. ${sender?.user_name} cancelled your appointment for ${formatDate(currentData?.date)}`;
          } else {
            body = `${sender?.user_name} cancelled their appointment for ${formatDate(currentData?.date)}`;
          }
          break;
        case IBookingStatus.RESCHEDULE_PENDING:
          if (receiver?.role === 'doctor') {
            body = `${sender?.user_name} has requested to reschedule their appointment to ${formatDate(currentData?.reschedule_request?.requested_date)}. Please approve or reject this request.`;
          } else {
            body = `Your reschedule request for ${formatDate(currentData?.reschedule_request?.requested_date)} is pending doctor approval.`;
          }
          break;
        default:
          // For new bookings (no status change)
          if (receiver?.role === 'doctor') {
            body = `${sender?.user_name} booked an appointment with you for ${formatDate(currentData?.date)}`;
          } else {
            body = `You booked an appointment with Dr. ${sender?.user_name} for ${formatDate(currentData?.date)}`;
          }
      }
    } else {
      // For new bookings (no oldData, so it's a new booking)
      if (receiver?.role === 'doctor') {
        body = `${sender?.user_name} booked an appointment with you for ${formatDate(currentData?.date)}`;
      } else {
        body = `You booked an appointment with Dr. ${sender?.user_name} for ${formatDate(currentData?.date)}`;
      }
    }
    return {
      notification: {
        body,
      },
      context: {
        booking_id: currentData?.booking_id,
        doctor_id: currentData?.doctor_id,
        customer_id: currentData?.customer_id,
        service_name: currentData?.service?.name,
        type:
          currentData?.status === IBookingStatus.RESCHEDULE_PENDING
            ? 'reschedule_request'
            : currentData?.reschedule_approved
              ? 'reschedule_approved'
              : currentData?.reschedule_rejected
                ? 'reschedule_rejected'
                : `booking_${currentData?.status.toLowerCase()}`,
        actions,
      },
    };
  }

  // async createBookingPayment2(payload: CreatePaymentDto) {
  //   const fireStore = this.firebaseService.getFireStore();
  //   const profile = (
  //     await fireStore
  //       .collection(this.firebaseService.collections.profiles)
  //       .doc(payload?.customer_id)
  //       .get()
  //   ).data();

  //   if (!profile) {
  //     throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);
  //   }

  //   const service = (
  //     await fireStore
  //       .collection(this.firebaseService.collections.services)
  //       .doc(payload?.service_id)
  //       .get()
  //   ).data();
  //   if (!service) {
  //     throw new HttpException('Service not found', HttpStatus.BAD_REQUEST);
  //   }

  //   let stripeCustomerId = profile?.stripe_id;
  //   if (!stripeCustomerId) {
  //     try {
  //       const customer = await this.stripe.customers.create({
  //         name: profile?.display_name,
  //         email: profile?.email,
  //         metadata: {
  //           uid: profile?.uid,
  //           user_name: profile?.user_name,
  //         },
  //       });
  //       stripeCustomerId = customer?.id;
  //       await fireStore
  //         .collection(this.firebaseService.collections.profiles)
  //         .doc(payload?.customer_id)
  //         .set({ stripe_id: stripeCustomerId }, { merge: true });
  //     } catch (error) {
  //       console.log(error);
  //       throw new HttpException(
  //         'create payment customer failed',
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       );
  //     }
  //   }

  //   const ephemeralKey = await this.stripe.ephemeralKeys.create(
  //     {
  //       customer: stripeCustomerId,
  //     },
  //     { apiVersion: '2024-09-30.acacia' },
  //   );

  //   const paymentIntent = await this.stripe.paymentIntents.create({
  //     amount: +service?.price_amount * 100,
  //     currency: 'usd',
  //     customer: stripeCustomerId,
  //     automatic_payment_methods: {
  //       enabled: true,
  //     },
  //     metadata: {
  //       customerId: profile.uid,
  //       doctorId: payload?.doctor_id,
  //       ephemeralId: ephemeralKey?.id,
  //     },
  //   });

  //   return {
  //     ephemeralId: ephemeralKey?.id,
  //     ephemeralKey: ephemeralKey?.secret,
  //     paymentIntent: paymentIntent.client_secret,
  //     customer: stripeCustomerId,
  //   };
  // }

  async createBookingPayment(payload: CreatePaymentDto) {
    const fireStore = this.firebaseService.getFireStore();
    const profile = (
      await fireStore
        .collection(this.firebaseService.collections.profiles)
        .doc(payload?.customer_id)
        .get()
    ).data();

    if (!profile) {
      throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);
    }

    console.log('Looking for service by doc ID:', {
      doc_id: payload?.service_id,
      collection: 'services',
    });

    // Get service directly by document ID
    const serviceDoc = await fireStore
      .collection('services')
      .doc(payload?.service_id)
      .get();

    console.log('Service lookup result:', {
      exists: serviceDoc.exists,
      id: serviceDoc.id,
      data: serviceDoc.data(),
    });

    if (!serviceDoc.exists) {
      throw new HttpException('Service not found', HttpStatus.BAD_REQUEST);
    }

    const service = serviceDoc.data();
    if (!service) {
      throw new HttpException(
        'Service data is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    const paymentInstance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });
    // Get price from either price_amount or price field
    const price = service?.price_amount || service?.price;
    if (!price) {
      throw new HttpException(
        'Service price is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('Creating Razorpay order:', {
      price,
      service_details: service,
      customer: profile.uid,
      doctor: payload?.doctor_id,
    });

    const result: any = await paymentInstance.orders.create({
      amount: +price * 100, // Convert to paise
      currency: 'INR',
      receipt: profile.uid,
      partial_payment: false,
      notes: {
        serviceId: service?.service_id || serviceDoc.id, // Use either service_id field or document ID
        customerId: profile.uid,
        doctorId: payload?.doctor_id,
      },
    });

    if (!result?.id) {
      this.logger.log(result, 'Payment order error');
      throw new HttpException(
        'Failed to generate order',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    this.logger.log(result, 'Payment order result');

    console.log('Razorpay order created:', {
      order_id: result?.id,
      amount: result?.amount,
      service_name: service?.name,
      customer: profile?.display_name,
    });

    return {
      key: process.env.RAZORPAY_API_KEY,
      order_id: result?.id,
      name: process.env.APP_NAME || 'Doctor Appointment',
      amount: result?.amount,
      currency: result?.currency || 'INR',
      description: service?.name || 'Medical Consultation',
      prefill: {
        email: profile?.email || '',
        contact: profile?.phone || '',
        name: profile?.display_name || '',
      },
      theme: {
        color: '#18A0FB',
      },
      notes: {
        orderId: result?.id,
        serviceId: service?.service_id || serviceDoc.id,
        customerId: profile.uid,
        doctorId: payload?.doctor_id,
        serviceName: service?.name,
        servicePrice: price,
      },
    };
  }
}
