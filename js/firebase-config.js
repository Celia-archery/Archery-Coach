/* ============================================================
   firebase-config.js — YOUR Firebase project credentials
   
   HOW TO SET UP FIREBASE:
   1. Go to https://console.firebase.google.com
   2. Click "Add project" → give it a name (e.g. "archery-tracker")
   3. In your project, click the web icon (</>)
   4. Register app → copy the firebaseConfig object
   5. Replace the placeholder values below with your real values
   6. In Firebase Console, enable:
      - Authentication → Email/Password
      - Firestore Database (start in test mode)
   
   FIRESTORE SECURITY RULES (paste in Firestore > Rules):
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /sharedScores/{doc} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == request.resource.data.uid;
       }
     }
   }
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
