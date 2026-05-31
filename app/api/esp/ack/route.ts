import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { initializeAdmin } from "@/lib/firebase-admin";

// Initialize Firebase Admin
initializeAdmin();
const db = admin.firestore();

// Simple device authentication
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

export async function POST(req: NextRequest) {
  try {
    // Authenticate ESP32 device
    const deviceId = authenticateDevice(req);
    if (!deviceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }    const body = await req.json();

    console.log(`ESP POST /api/esp/ack deviceId=${deviceId}`, body);

    const {
      commandId,
      success,
      timestamp,
      state,
      energy,
    } = body;    // Extract device states from the state object
    const lockState = state?.lock || "UNKNOWN";
    const evOn = state?.ev ?? false;
    const p3On = state?.p3 ?? false;
    const rfidDetected = state?.rfid ?? false;

    // Extract energy data
    const energyOk = energy?.ok ?? false;
    const evmeter = energy?.evmeter || {};
    const p3meter = energy?.p3meter || {};// 1. Update command status to "completed" (if commandId provided)
    if (commandId) {
      const commandStatus = success ? "completed" : "failed";
      
      await db
        .collection("commands")
        .doc(commandId)
        .update({
          status: commandStatus,
          executedAt: admin.firestore.FieldValue.serverTimestamp(),
          espResult: {
            success,
            lockState,
            evOn,
            p3On,
            timestamp,
          },
        });
    }    // 2. Update the box document with current device state
    // This updates boxes collection, maintaining your existing structure
    const boxUpdateData: any = {};

    if (lockState) {
      boxUpdateData["isLocked"] = lockState === "LOCKED";
    }

    // Update RFID detected status
    if (rfidDetected !== undefined) {
      boxUpdateData["rfidDetected"] = rfidDetected;
    }

    // Update EV charger status if provided
    if (evOn !== undefined && energyOk && evmeter && Object.keys(evmeter).length > 0) {
      boxUpdateData["devices.evCharger.isOn"] = evOn;
      boxUpdateData["devices.evCharger.voltage"] = evmeter.voltage || 0;
      boxUpdateData["devices.evCharger.current"] = evmeter.current || 0;
      boxUpdateData["devices.evCharger.power"] = evmeter.power || 0;
    } else if (evOn !== undefined) {
      boxUpdateData["devices.evCharger.isOn"] = evOn;
    }

    // Update 3-pin socket status if provided
    if (p3On !== undefined && energyOk && p3meter && Object.keys(p3meter).length > 0) {
      boxUpdateData["devices.threePinSocket.isOn"] = p3On;
      boxUpdateData["devices.threePinSocket.voltage"] = p3meter.voltage || 0;
      boxUpdateData["devices.threePinSocket.current"] = p3meter.current || 0;
      boxUpdateData["devices.threePinSocket.power"] = p3meter.power || 0;
    } else if (p3On !== undefined) {
      boxUpdateData["devices.threePinSocket.isOn"] = p3On;
    }

    // Always update the lastUpdated timestamp
    boxUpdateData["lastUpdated"] = admin.firestore.FieldValue.serverTimestamp();

    // Update the box document
    if (Object.keys(boxUpdateData).length > 0) {
      await db
        .collection("boxes")
        .doc(deviceId)
        .update(boxUpdateData);
    }    // 3. Optional: Store energy readings as separate collection for time-series data
    // This allows historical energy tracking
    if (energyOk && p3meter && Object.keys(p3meter).length > 0) {
      await db
        .collection("energy_readings")
        .add({
          boxId: deviceId,
          source: "p3",
          voltage: p3meter.voltage || 0,
          current: p3meter.current || 0,
          power: p3meter.power || 0,
          energy: p3meter.energy || 0,
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    if (energyOk && evmeter && Object.keys(evmeter).length > 0) {
      await db
        .collection("energy_readings")
        .add({
          boxId: deviceId,
          source: "ev",
          voltage: evmeter.voltage || 0,
          current: evmeter.current || 0,
          power: evmeter.power || 0,
          energy: evmeter.energy || 0,
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return NextResponse.json(
      { ok: true, message: "Status received and saved" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/esp/ack:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
