# How to Update Firestore Security Rules

## Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **smart-box-app-6c55c**
3. In the left sidebar, click **Firestore Database**
4. Click the **Rules** tab at the top

## Step 2: Replace the Rules

You'll see your current rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Delete everything** and replace with this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Boxes collection - main device data
    match /boxes/{boxId} {
      // Only box owner can read/write
      allow read, write: if isBoxOwner(boxId);

      // Commands subcollection - user sends commands
      match /commands/{commandId} {
        allow create: if isBoxOwner(boxId) &&
                         request.resource.data.status == "PENDING" &&
                         request.resource.data.createdAt == request.time;
        allow read: if isBoxOwner(boxId);
        allow update, delete: if false;
      }

      // Status subcollection - ESP32/backend writes here
      match /status/{document=**} {
        allow read: if isBoxOwner(boxId);
        allow write: if false;  // Only Admin SDK (backend) can write
      }

      // Energy readings - ESP32/backend writes here
      match /energy_readings/{document=**} {
        allow read: if isBoxOwner(boxId);
        allow write: if false;  // Only Admin SDK (backend) can write
      }
    }

    // Helper function
    function isBoxOwner(boxId) {
      return request.auth != null &&
             get(/databases/$(database)/documents/boxes/$(boxId)).data.ownerUid == request.auth.uid;
    }
  }
}
```

## Step 3: Test the Rules

Click **Rules Playground** (bottom-left) to test before publishing.

Test case 1 - User creates a command (should allow):

- **Authenticated**: Yes (any user ID)
- **Path**: `boxes/box-001/commands/cmd_1`
- **Operation**: Create
- **Data**: `{ "status": "PENDING", "createdAt": "<current timestamp>", ... }`

Test case 2 - User tries to write to status (should deny):

- **Authenticated**: Yes
- **Path**: `boxes/box-001/status/current`
- **Operation**: Create
- **Result**: ❌ Denied (read-only for clients)

## Step 4: Publish

Click **Publish** button.

---

## Key Changes from Your Old Rules

| Old Rule                              | New Rule                               | Why                                               |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Any auth user can read/write anything | Only box owner can access their box    | Security: users can't access other users' boxes   |
| No restriction on who writes          | Backend can write status (Admin SDK)   | ESP32 status is authoritative, backend manages it |
| No command structure                  | Commands must have `status: "PENDING"` | Better command tracking                           |

---

## What This Means

✅ **Users CAN:**

- Read their own box data
- Create commands in their box
- Read command status and device status

❌ **Users CANNOT:**

- Read other users' boxes
- Directly write device status (only backend/ESP32 via Admin SDK)
- Update/delete commands

✅ **Backend (Admin SDK) CAN:**

- Write device status
- Update command status
- Write energy readings
- (Bypasses all rules)

---

## Troubleshooting

**"Permission denied" when creating a command?**

- Make sure `ownerUid` field exists on the box document
- Make sure it matches the current user's UID
- Make sure your command has `status: "PENDING"`

**Can't read device status?**

- Make sure you're reading from `boxes/{boxId}/status/current`
- Make sure you're the box owner
