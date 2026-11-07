"use strict";

/** Isolated callable export; registration requires verified Firebase Phone Auth. */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { createRegisterCustomerHandler } = require("./registrationHandler");
const { createUpdateCustomerVerifiedPhoneHandler } = require("./phoneSyncHandler");
const { createPhoneEligibilityHandler } = require("./phoneEligibilityHandler");
const { createOrderStatusSyncHandler } = require("./orderStatusSync");

if (getApps().length === 0) initializeApp();
const db = getFirestore();

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

exports.syncOrderStatus = onDocumentUpdated(
  { document: "orders/{orderId}", maxInstances: 10 },
  createOrderStatusSyncHandler({ db })
);
