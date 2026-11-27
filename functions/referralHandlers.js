"use strict";

const REFERRAL_REWARD_COINS = 50;
const REFERRAL_WELCOME_BONUS_COINS = 50;
const CUSTOMER_ID_RE = /^(?:ONCUS\d{6,7}|SASS\d{6,7})$/i;

function getCustomerPath(customerId) {
  if (!CUSTOMER_ID_RE.test(customerId || "")) return null;
  const collection = customerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
  return `${collection}/${customerId}`;
}

function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 ? `+${digits.slice(0, 2)} ${digits.slice(2, 4)}*****` : "—";
}

function createReferralSignupHandler({ db, FieldValue }) {
  return async (event) => {
    const referredCustomerId = String(event.params?.customerId || "").trim();
    const referredCustomer = event.data?.data();
    const referredCustomerPath = getCustomerPath(referredCustomerId);
    if (!referredCustomerPath || !referredCustomer) return;

    const referralCode = String(referredCustomer.referredBy || "").trim().toUpperCase();
    const referrerPath = getCustomerPath(referralCode);
    if (!referrerPath || referralCode === referredCustomerId.toUpperCase()) return;

    const referrerRef = db.doc(referrerPath);
    const referralRef = referrerRef.collection("referrals").doc(referredCustomerId);
    const welcomeCoinRef = db.doc(`${referredCustomerPath}/coinHistory/referral_welcome_${referredCustomerId}`);
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const [referrerSnapshot, existingReferral, welcomeCoinSnapshot] = await Promise.all([
        transaction.get(referrerRef),
        transaction.get(referralRef),
        transaction.get(welcomeCoinRef),
      ]);
      if (!referrerSnapshot.exists) return;
      const referrer = referrerSnapshot.data() || {};
      if (referrer.role && referrer.role !== "customer") return;
      if (referrer.accountType && referrer.accountType !== "customer") return;

      if (!existingReferral.exists) {
        transaction.create(referralRef, {
          id: referredCustomerId,
          userId: referralCode,
          referredCustomerId,
          referralCode,
          friendName: String(referredCustomer.fullName || referredCustomer.name || "Referred Friend").slice(0, 120),
          phoneMasked: maskPhone(referredCustomer.phone || referredCustomer.number),
          status: "Signed Up (Order Pending)",
          rewardCoins: 0,
          friendRewardCoins: REFERRAL_WELCOME_BONUS_COINS,
          rewardStatus: "pending",
          date: now,
          referredAt: now,
          createdAt: now,
        });
      }
      if (!welcomeCoinSnapshot.exists) {
        transaction.create(welcomeCoinRef, {
          id: welcomeCoinRef.id,
          userId: referredCustomerId,
          amount: REFERRAL_WELCOME_BONUS_COINS,
          type: "referral",
          description: "Referral welcome bonus",
          referredBy: referralCode,
          timestamp: now,
          createdAt: now,
        });
        transaction.set(db.doc(getCustomerPath(referredCustomerId)), {
          smartCoins: FieldValue.increment(REFERRAL_WELCOME_BONUS_COINS),
          earnedCoins: FieldValue.increment(REFERRAL_WELCOME_BONUS_COINS),
          updatedAt: now,
          lastUpdated: now,
        }, { merge: true });
      }
    });
  };
}

function createReferralOrderRewardHandler({ db, FieldValue }) {
  return async (transaction, order, orderId) => {
    const buyerId = String(order.customerId || order.userId || order.buyerId || "").trim();
    const buyerPath = getCustomerPath(buyerId);
    if (!buyerPath) return;

    const buyerRef = db.doc(buyerPath);
    const buyerSnapshot = await transaction.get(buyerRef);
    if (!buyerSnapshot.exists) return;
    const buyer = buyerSnapshot.data() || {};
    const referralCode = String(buyer.referredBy || "").trim().toUpperCase();
    const referrerPath = getCustomerPath(referralCode);
    if (!referrerPath || referralCode === buyerId.toUpperCase()) return;

    const referrerRef = db.doc(referrerPath);
    const referralRef = referrerRef.collection("referrals").doc(buyerId);
    const ledgerCollection = referralCode.toUpperCase().startsWith("ONCUS") ? "coinHistory" : "coinsHistory";
    const transactionId = `referral_${buyerId}`;
    const coinRef = referrerRef.collection(ledgerCollection).doc(transactionId);
    const [referrerSnapshot, referralSnapshot, coinSnapshot] = await Promise.all([
      transaction.get(referrerRef),
      transaction.get(referralRef),
      transaction.get(coinRef),
    ]);
    if (!referrerSnapshot.exists || coinSnapshot.exists) return;
    const referrer = referrerSnapshot.data() || {};
    if (referrer.role && referrer.role !== "customer") return;
    if (referrer.accountType && referrer.accountType !== "customer") return;

    const now = FieldValue.serverTimestamp();
    transaction.set(referralRef, {
      id: buyerId,
      userId: referralCode,
      referredCustomerId: buyerId,
      referralCode,
      friendName: String(buyer.fullName || buyer.name || "Referred Friend").slice(0, 120),
      phoneMasked: maskPhone(buyer.phone || buyer.number),
      status: "Completed First Order",
      rewardCoins: REFERRAL_REWARD_COINS,
      rewardStatus: "credited",
      rewardOrderId: String(order.orderId || orderId),
      rewardedAt: now,
      date: referralSnapshot.exists ? (referralSnapshot.get("date") || now) : now,
      referredAt: referralSnapshot.exists ? (referralSnapshot.get("referredAt") || now) : now,
      createdAt: now,
    }, { merge: true });
    transaction.create(coinRef, {
      id: transactionId,
      userId: referralCode,
      amount: REFERRAL_REWARD_COINS,
      type: "referral",
      description: `Referral reward for ${buyer.fullName || buyer.name || buyerId}'s first completed order`,
      orderId: String(order.orderId || orderId),
      referredCustomerId: buyerId,
      timestamp: now,
      createdAt: now,
    });
    transaction.set(referrerRef, {
      smartCoins: FieldValue.increment(REFERRAL_REWARD_COINS),
      earnedCoins: FieldValue.increment(REFERRAL_REWARD_COINS),
      updatedAt: now,
      lastUpdated: now,
    }, { merge: true });
  };
}

module.exports = {
  REFERRAL_REWARD_COINS,
  REFERRAL_WELCOME_BONUS_COINS,
  createReferralSignupHandler,
  createReferralOrderRewardHandler,
};
