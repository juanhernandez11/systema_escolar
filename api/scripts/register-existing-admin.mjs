import 'dotenv/config';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || 'sistema-escolar-fec8f';
const schoolId = projectId;
const schoolName = process.env.SCHOOL_NAME || 'Colegio del Valle';

if (!getApps().length) {
  const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credJson) throw new Error('Falta GOOGLE_APPLICATION_CREDENTIALS_JSON en .env');
  initializeApp({ credential: cert(JSON.parse(credJson)) });
}

const auth = getAuth();
const db = getFirestore();

// Correo del usuario ya existente en Firebase Auth que se registrará como ADMIN
const email = 'colegioadmin7@gmail.com';
const name = 'Admin';

async function main() {
  const user = await auth.getUserByEmail(email);
  console.log(`Usuario encontrado: ${user.uid} (${user.email})`);

  const schoolRef = db.doc(`schools/${schoolId}`);
  const batch = db.batch();
  batch.set(schoolRef, { name: schoolName }, { merge: true });
  batch.set(schoolRef.collection('users').doc(user.uid), {
    id: user.uid, schoolId, name, email: user.email,
    role: 'ADMIN', active: true,
  });
  batch.set(db.doc(`uidIndex/${user.uid}`), { schoolId });
  batch.set(db.doc(`userIndexByEmail/${encodeURIComponent(user.email)}`), {
    uid: user.uid, schoolId,
  });
  await batch.commit();
  console.log(`✓ Admin registrado en Firestore: ${email} (colegio: ${schoolId})`);
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
