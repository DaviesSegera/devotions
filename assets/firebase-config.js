/* Firebase settings for the Amen button and reader messages.
   Replace the six PASTE-… values below with the ones from your own Firebase
   project. Step-by-step instructions are in SETUP-COMMENTS.md.

   Until they are replaced, the Amen button and the message form stay hidden and
   the website behaves exactly as it did before. Nothing breaks while you wait.

   These values are not secrets. Every Firebase website carries them in public,
   and they identify the project rather than granting access to it. What may be
   read and written is decided by the security rules in firestore.rules. */

window.DEVOTIONS_FIREBASE = {
  apiKey: 'PASTE-YOUR-API-KEY',
  authDomain: 'PASTE-YOUR-PROJECT.firebaseapp.com',
  projectId: 'PASTE-YOUR-PROJECT-ID',
  storageBucket: 'PASTE-YOUR-PROJECT.firebasestorage.app',
  messagingSenderId: 'PASTE-YOUR-SENDER-ID',
  appId: 'PASTE-YOUR-APP-ID'
};
