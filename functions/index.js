"use strict";

/** Isolated callable export; registration requires verified Firebase Phone Auth. */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { createRegisterCustomerHandler } = require("./registrationHandler");

if (getApps().length === 0) initializeApp();
const db = getFirestore();

exports.registerCustomer = onCall(
  { maxInstances: 5, timeoutSeconds: 30 },
  createRegisterCustomerHandler({ db, FieldValue, HttpsError })
);
