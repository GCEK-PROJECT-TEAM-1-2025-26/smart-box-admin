import * as admin from "firebase-admin";

let initialized = false;

export function initializeAdmin() {
  if (initialized) {
    return;
  }

  // Firebase Admin SDK requires a service account JSON.
  // You must download this from Firebase Console:
  // Project Settings → Service Accounts → Generate new private key
  // Store it as FIREBASE_SERVICE_ACCOUNT_JSON env var (as a JSON string)
  // or as a file reference in FIREBASE_SERVICE_ACCOUNT_PATH

  try {
    // Option 1: Load from env var (JSON string)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      initialized = true;
      console.log("Firebase Admin initialized via env JSON");
      return;
    }

    // Option 2: Load from file (if running locally)
    // In production, use env var instead
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      // This would require 'fs' module; typically you use Option 1 for production
      console.warn(
        "Using FIREBASE_SERVICE_ACCOUNT_PATH is not recommended in production. Use FIREBASE_SERVICE_ACCOUNT_JSON instead."
      );
      // For local dev:
      // const serviceAccount = require(serviceAccountPath);
      // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }

    // If neither is set, try to use Application Default Credentials (for Google Cloud)
    if (!initialized && !admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      initialized = true;
      console.log("Firebase Admin initialized via Application Default Credentials");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}
