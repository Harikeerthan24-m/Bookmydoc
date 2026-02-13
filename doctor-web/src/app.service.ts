import { Injectable } from '@nestjs/common';
import { FirebaseService } from '@app/firebase/firebase.service';
import HealthTipsData from './data/FactsModel.data';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class AppService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getFacts(reset = false) {
    const fireStore = this.firebaseService.getFireStore();
    const factsRef = await fireStore
      .collection(this.firebaseService.collections.health_tips)
      .where('enable', '==', true)
      .get();

    if (reset && factsRef.empty) {
      const batch = fireStore.batch();
      HealthTipsData.forEach((fact: any) => {
        const factId = String(uuidv7());
        const docRef = fireStore
          .collection(this.firebaseService.collections.health_tips)
          .doc(factId);
        batch.create(docRef, {
          id: factId,
          enable: true,
          fact: fact.fact,
        });
      });
      batch.commit();
    }

    let facts = factsRef.docs.map((doc: any) => doc.data());
    facts = facts.sort(() => 0.5 - Math.random()).slice(0, 5);
    return facts;
  }
}
