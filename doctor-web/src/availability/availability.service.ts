import { FirebaseService } from '@app/firebase/firebase.service';
import { IAvailabilitySlot, IDay } from './type';
import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { validateTime } from '@app/common/utils';

@Injectable()
export class AvailabilityService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getAvailabilitySlots(filters?: any) {
    const fireStore = this.firebaseService.getFireStore();
    let availabilitySlots: any = fireStore.collection(
      this.firebaseService.collections.availability_slots,
    );

    if (filters?.doctorId) {
      availabilitySlots = availabilitySlots.where(
        'uid',
        '==',
        filters?.doctorId,
      );
    }

    if (filters?.day) {
      availabilitySlots = availabilitySlots.where('day', '==', filters?.day);
    }

    availabilitySlots = await availabilitySlots.get();

    return availabilitySlots.docs.map(
      (doc: any) => doc.data() as IAvailabilitySlot,
    );
  }

  async saveAvailabilitySlots(doctorId: string, payload: IAvailabilitySlot[]) {
    const fireStore = this.firebaseService.getFireStore();

    const deleteBatch = fireStore.batch();
    const currentRef = await fireStore
      .collection(this.firebaseService.collections.availability_slots)
      .where('uid', '==', doctorId)
      .get();
    currentRef.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    const batch = fireStore.batch();
    const availabilitySlots = [];
    const availabilityDays = [];

    for (const slot of payload) {
      const slotId = String(slot?.slot_id || uuidv7());
      const docRef = fireStore
        .collection(this.firebaseService.collections.availability_slots)
        .doc(slotId);

      if (!slot?.day || !doctorId || !slot?.start_time || !slot?.end_time) {
        continue;
      }

      const startTime = validateTime(slot?.start_time);
      const endTime = validateTime(slot?.end_time);
      const duration =
        (new Date(0, 0, 0, +endTime?.hours, +endTime?.minutes).getTime() -
          new Date(0, 0, 0, +startTime?.hours, +startTime?.minutes).getTime()) /
        1000 /
        60;

      const day = slot?.day.toLocaleLowerCase() as IDay;
      const slotDoc: IAvailabilitySlot = {
        slot_id: slotId,
        uid: doctorId,
        day,
        duration: duration,
        start_time: `${startTime?.hours}:${startTime?.minutes}`,
        end_time: `${endTime?.hours}:${endTime?.minutes}`,
      };
      if (!availabilityDays.includes(day)) {
        availabilityDays.push(day);
      }
      availabilitySlots.push(slotDoc);
      batch.create(docRef, slotDoc);
    }

    await batch.commit();

    await fireStore
      .collection(this.firebaseService.collections.profiles)
      .doc(doctorId)
      .set(
        {
          availability: availabilityDays,
          availabilitySlots: JSON.stringify(availabilitySlots),
        },
        { merge: true },
      );

    return availabilitySlots;
  }
}
