import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
  });
}

const db = admin.firestore();

const TAMIL_MALE_NAMES = [
  'Arulselvan', 'Velmurugan', 'Karthikeyan', 'Muralidharan', 'Rajeshwaran',
  'Selvakumar', 'Balasubramanian', 'Manikandan', 'Vikramaditya', 'Suryaprakash',
  'Thirumalai', 'Senthilnathan', 'Gnanasekaran', 'Poovannan', 'Kathiravan',
  'Ilango', 'Marudhu', 'Iniyan', 'Kavin', 'Anbarasan'
];

const TAMIL_FEMALE_NAMES = [
  'Anithalakshmi', 'Kavithasri', 'Priyadharshini', 'Deepalakshmi', 'Meenakshi',
  'Selvi', 'Vidyashree', 'Ramya', 'Radhamani', 'Chitraselvi',
  'Senthamarai', 'Kanimozhi', 'Yazhini', 'Kayalvizhi', 'Thamarai',
  'Ponni', 'Nila', 'Malar', 'Oviya', 'Amudha'
];

const TN_DISTRICTS = [
  'Chennai', 'Madurai', 'Coimbatore', 'Erode', 'Salem',
  'Tiruchirappalli', 'Tirunelveli', 'Vellore', 'Thoothukudi', 'Thanjavur',
  'Tiruppur', 'Kanchipuram', 'Dindigul', 'Cuddalore', 'Ranipet'
];

const SPECIALISTS = [
  'Cardiologist', 'Dermatologist', 'Pediatrician', 'General Physician',
  'ENT Specialist', 'Psychiatrist', 'Orthopedist', 'Dentist',
  'Gynecologist', 'Neurologist', 'Gastroenterologist', 'Urologist',
  'Ophthalmologist', 'Oncologist', 'Radiologist', 'Pulmonologist',
  'Nephrologist'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function reseed() {
  console.log('Starting re-seeding with Tamil Nadu doctors...');

  // 1. Clear existing doctor-related data
  const collectionsToClear = ['profiles', 'services', 'availabilitySlots'];
  for (const coll of collectionsToClear) {
    const snapshot = await db.collection(coll).get();
    const batch = db.batch();
    
    if (coll === 'profiles') {
        // Only clear doctors from profiles
        const doctors = await db.collection('profiles').where('role', '==', 'doctor').get();
        doctors.forEach(doc => batch.delete(doc.ref));
    } else {
        snapshot.forEach(doc => batch.delete(doc.ref));
    }
    
    await batch.commit();
    console.log(`Cleared ${coll} collection (doctors only for profiles).`);
  }

  // 2. Generate Doctors
  let totalDoctors = 0;
  for (const district of TN_DISTRICTS) {
    console.log(`Generating doctors for ${district}...`);
    for (let i = 0; i < 4; i++) { // 4 doctors per district = 60 doctors total
      const batch = db.batch();
      const isMale = Math.random() > 0.5;
      const firstName = isMale 
        ? TAMIL_MALE_NAMES[Math.floor(Math.random() * TAMIL_MALE_NAMES.length)]
        : TAMIL_FEMALE_NAMES[Math.floor(Math.random() * TAMIL_FEMALE_NAMES.length)];
      
      const lastName = 'M'; // Initial or common suffix
      const fullName = `Dr. ${firstName} ${lastName}`;
      const specialty = SPECIALISTS[Math.floor(Math.random() * SPECIALISTS.length)];
      const uid = uuidv4();

      const doctorProfile = {
        uid,
        display_name: fullName,
        email: `${firstName.toLowerCase()}@bookmydoc.tn`,
        phone: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
        role: 'doctor',
        location: district,
        specialty,
        expertiseList: [specialty, 'Primary Care', 'Consultation'],
        bio: `${fullName} is a dedicated ${specialty} based in ${district}, Tamil Nadu, with over 10 years of experience.`,
        photoUrl: '', // Removed image
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        reviews_count: Math.floor(Math.random() * 200),
        gender: isMale ? 'Male' : 'Female',
        experience: 5 + Math.floor(Math.random() * 20),
        ratings: Array.from({ length: 5 }, () => 4 + Math.random()),
        created_at: new Date().toISOString(),
      };

      batch.set(db.collection('profiles').doc(uid), doctorProfile);

      // 3. Generate Services for this doctor
      const serviceId1 = uuidv4();
      const service1 = {
        service_id: serviceId1,
        doctor_id: uid,
        name: 'Quick Consultation',
        description: 'Custom consultation type',
        type: 'General',
        price: 200,
        duration: 20,
      };
      batch.set(db.collection('services').doc(serviceId1), service1);

      const serviceId2 = uuidv4();
      const service2 = {
        service_id: serviceId2,
        doctor_id: uid,
        name: `${specialty} Specialist Visit`,
        description: `Specialized ${specialty} consultation and checkup`,
        type: 'Specialist',
        price: 500,
        duration: 30,
      };
      batch.set(db.collection('services').doc(serviceId2), service2);

      // 4. Generate Availability Slots
      for (const day of ['Sunday', 'Monday', 'Wednesday', 'Friday']) {
        // Morning block matching user request
        const slotId1 = uuidv4();
        batch.set(db.collection('availabilitySlots').doc(slotId1), {
          slot_id: slotId1,
          doctor_id: uid,
          day: day.toLowerCase(),
          start_time: day === 'Sunday' ? '09:00' : '10:00',
          end_time: day === 'Sunday' ? '12:00' : '11:00',
          status: 'available',
          created_at: new Date().toISOString(),
        });

        // Evening block
        const slotId2 = uuidv4();
        batch.set(db.collection('availabilitySlots').doc(slotId2), {
          slot_id: slotId2,
          doctor_id: uid,
          day: day.toLowerCase(),
          start_time: '17:00',
          end_time: '20:00',
          status: 'available',
          created_at: new Date().toISOString(),
        });
      }
      
      await batch.commit();
      totalDoctors++;
    }
    console.log(`Finished ${district}. Total doctors seeded: ${totalDoctors}`);
  }

  console.log('Successfully re-seeded database with 60 Tamil Nadu doctors, including services and availability slots.');
}

reseed().catch(err => {
  console.error('Error re-seeding:', err);
  process.exit(1);
});
