# Referral System Workflow

## Attribution

Product share URLs include the sharer's referral code as `ref`. The first referral
code captured in a browser is kept in local storage for 30 days and carried into
signup. A later link does not replace that first attribution. Signup may also
receive a referral code directly in its route search parameters.

## Firestore records

Referrals are stored as a customer-owned subcollection:

```text
onlineCustomers/{referrerId}/referrals/{referredCustomerId}
```

The document ID is the referred customer's stable customer ID, making signup
processing idempotent. Firestore creates the subcollection when its first
referral document is written; there is no separate empty-collection creation
step.

Referral records contain `id`, `userId`, `referredCustomerId`, `referralCode`,
`friendName`, `phoneMasked`, `status`, `rewardCoins`, `friendRewardCoins`,
`rewardStatus`, `date`, `referredAt`, and, after reward, `rewardOrderId` and
`rewardedAt`.

The customer's `referredBy` field is the durable attribution source. A signup
Cloud Function trigger checks that it points to an existing customer, creates
the referral activity record, and credits the referred customer's 50 Smart Coin
welcome bonus. It creates the ledger record in
`onlineCustomers/{customerId}/coinHistory/referral_welcome_{customerId}`.

When the referred customer's first order reaches `delivered`, the order status
Cloud Function marks the referral complete and credits the referrer 50 Smart
Coins. It uses a deterministic ledger ID (`referral_{referredCustomerId}`) so
retries or repeated status events cannot issue a second reward. The referrer's
coin ledger entry is stored in that referrer's `coinHistory` subcollection.

## Access control and deployment

Customers may read their own referral subcollection. Clients cannot create,
change, or delete referral activity or coin ledger entries; trusted Functions
write these records. The app rules and production rules proposal contain the
read-only owner rule. Functions are prepared for emulator/local deployment;
production deployment and live Firestore mutations require a separate rollout.

Legacy `users/{SASS_ID}/referrals` and misspelled `refferals` records remain
readable through the existing referral reader.
