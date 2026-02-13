import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private admin: admin.app.App;
  collections = {
    profiles: 'profiles',
    availability_slots: 'availabilitySlots',
    bookings: 'bookings',
    services: 'services',
    health_tips: 'healthTips',
  };

  constructor() {
    const firebaseConfig = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };

    this.admin = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  getAuth() {
    return this.admin.auth();
  }

  getFirestore() {
    return this.admin.firestore();
  }

  getFireStore() {
    return this.admin.firestore();
  }

  getStorage() {
    return this.admin.storage();
  }

  getMessage() {
    return this.admin.messaging();
  }
}
