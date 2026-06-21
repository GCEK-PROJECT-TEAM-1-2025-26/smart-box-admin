import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { initializeAdmin } from "@/lib/firebase-admin";

// Initialize Firebase Admin
initializeAdmin();
const db = admin.firestore();

// Simple device authentication: check headers
function authenticateDevice(req: NextRequest): string | null {
  const deviceId = req.headers.get("x-device-id");
  const deviceSecret = req.headers.get("x-device-secret");

  if (!deviceId || !deviceSecret) {
    return null;
  }

  const VALID_SECRET = process.env.ESP_DEVICE_SECRET || "super-secret-token";
  if (deviceSecret !== VALID_SECRET) {
    return null;
  }

  return deviceId;
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate ESP32 device
    const deviceId = authenticateDevice(req);
    if (!deviceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const lastCommandId = searchParams.get("lastCommandId") || "";

    console.log(`ESP GET /api/esp/next-command deviceId=${deviceId}, lastCommandId=${lastCommandId}`);

    // Query Firestore for pending commands
    // Using existing structure: commands collection (not boxes subcollection)
    const query: FirebaseFirestore.Query = db
      .collection("commands")
      .where("boxId", "==", deviceId)
      .where("status", "==", "pending")
      .orderBy("createdAt", "asc")
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      // No pending command
      return NextResponse.json({ none: true });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();    // Map from existing command structure to ESP32 expected format
    const actions: Record<string, unknown> = {};

    if (data.commandType === "unlock") {
      actions.lock = "UNLOCK";
    } else if (data.commandType === "lock") {
      actions.lock = "LOCK";
    } else if ((data.commandType === "deviceControl" || data.commandType === "device_control") && data.payload) {
      // Handle device control commands (support both camelCase and snake_case)
      if (data.payload.device === "evCharger") {
        // Support both "turnOn" and "turn_on" action formats
        const actionValue = data.payload.action;
        actions.ev = actionValue === "turnOn" || actionValue === "turn_on" ? true : false;
      } else if (data.payload.device === "threePinSocket") {
        // Support both "turnOn" and "turn_off" action formats
        const actionValue = data.payload.action;
        actions.p3 = actionValue === "turnOn" || actionValue === "turn_on" ? true : false;
      }
    }

    return NextResponse.json({
      commandId: doc.id,
      actions,
    });
  } catch (error) {
    console.error("Error in GET /api/esp/next-command:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
