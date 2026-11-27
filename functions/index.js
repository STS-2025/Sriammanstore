"use strict";

/** Isolated callable export; registration requires verified Firebase Phone Auth. */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineString } = require("firebase-functions/params");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { createRegisterCustomerHandler } = require("./registrationHandler");
const { createUpdateCustomerVerifiedPhoneHandler } = require("./phoneSyncHandler");
const { createPhoneEligibilityHandler } = require("./phoneEligibilityHandler");
const { createEmailPhoneOtpHandlers } = require("./emailPhoneOtpHandler");
const { createOrderStatusSyncHandler } = require("./orderStatusSync");
const { createReferralSignupHandler } = require("./referralHandlers");

setGlobalOptions({ region: "asia-south1" });

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const identityToolkitWebApiKey = defineString("IDENTITY_TOOLKIT_WEB_API_KEY");

exports.registerCustomer = onCall(
  { maxInstances: 5, timeoutSeconds: 30 },
  createRegisterCustomerHandler({ db, FieldValue, HttpsError })
);

exports.updateCustomerVerifiedPhone = onCall(
  { maxInstances: 5, timeoutSeconds: 30 },
  createUpdateCustomerVerifiedPhoneHandler({ db, auth: getAuth(), HttpsError, FieldValue })
);

exports.checkCustomerPhoneEligibility = onCall(
  {
    maxInstances: 5,
    timeoutSeconds: 15,
  },
  createPhoneEligibilityHandler({
    db,
    auth: getAuth(),
    HttpsError,
  }),
);

const emailPhoneOtpHandlers = createEmailPhoneOtpHandlers({
  db,
  auth: getAuth(),
  HttpsError,
  webApiKey: process.env.FIREBASE_AUTH_EMULATOR_HOST
    ? (process.env.IDENTITY_TOOLKIT_WEB_API_KEY || "demo-sri-amman-store-local-emulator-key")
    : () => identityToolkitWebApiKey.value(),
});

exports.requestCustomerEmailPhoneOtp = onCall(
  { maxInstances: 5, timeoutSeconds: 30 },
  emailPhoneOtpHandlers.requestEmailPhoneOtp,
);

exports.verifyCustomerEmailPhoneOtp = onCall(
  { maxInstances: 5, timeoutSeconds: 30 },
  emailPhoneOtpHandlers.verifyEmailPhoneOtp,
);

exports.syncOrderStatus = onDocumentUpdated(
  { document: "orders/{orderId}", maxInstances: 10 },
  createOrderStatusSyncHandler({ db, FieldValue })
);

exports.recordCustomerReferral = onDocumentCreated(
  { document: "onlineCustomers/{customerId}", maxInstances: 10 },
  createReferralSignupHandler({ db, FieldValue })
);
