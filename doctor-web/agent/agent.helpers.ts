import * as admin from 'firebase-admin';

/**
 * Searches for doctors in Firestore based on specialty.
 */
export async function searchDoctorsInFirestore(db, specialty) {
  const snapshot = await db
    .collection('profiles')
    .where('role', '==', 'doctor')
    .where('expertiseList', 'array-contains', specialty)
    .limit(5)
    .get();

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      doctorId: doc.id,
      name: d.display_name || 'Doctor',
      specialization: specialty,
      location: {
        city: d.location?.city || 'Remote',
        address: d.location?.address || '',
        state: d.location?.state || '',
      },
      photoUrl: d.photoUrl || '',
      rating: d.star_rating || 5,
      experience: d.experience || '',
      registrationNumber: d.doctor_registration_number || '',
    };
  });
}

/**
 * Persists the voice conversation history to Firestore.
 */
export async function persistVoiceChatHistory(db, userId, messages, specialty, doctors) {
  const sessionRef = db.collection('chatSessions').doc(userId);
  const messagesRef = sessionRef.collection('messages');

  let lastUserMsg = `I need a ${specialty}.`;

  // Filter for actual text messages to avoid 'undefined' role errors from function calls
  const textMessages = messages.filter(
    (m) =>
      m.type === 'message' &&
      typeof m.textContent === 'string' &&
      m.textContent.trim().length > 0,
  );

  let sequenceMillis = Date.now() - textMessages.length * 1000;

  for (const m of textMessages) {
    if (m.role === 'user') lastUserMsg = m.textContent;

    const msgTime = new Date(sequenceMillis++);
    const msgId = m.id || `voice-${sequenceMillis}`;

    const msgData: any = {
      role: m.role,
      content: m.textContent,
      createdAt: admin.firestore.Timestamp.fromDate(msgTime),
    };
    if (m.role === 'user') msgData.inputType = 'voice';
    if (m.role === 'assistant') msgData.outputType = 'voice';

    await messagesRef.doc(msgId).set(msgData, { merge: true });
  }

  const finalAsstMsg = `I found ${doctors.length} matching doctors for ${specialty}.`;

  await sessionRef.set(
    {
      userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: lastUserMsg,
      lastAssistantMessage: finalAsstMsg,
    },
    { merge: true },
  );

  await messagesRef.add({
    role: 'assistant',
    content: finalAsstMsg,
    meta: {
      extractedInfo: { specialty, conversationStage: 'recommending' },
      doctorRecommendations: doctors,
    },
    outputType: 'voice',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
