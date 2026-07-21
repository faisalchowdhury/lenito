# BloodFit — Subscription (Native IAP) API

Native IAP (Apple App Store / Google Play). Payment happens in the store; the
backend verifies receipts and tracks subscription status.

- **Base URL:** `https://faisal5000.merinasib.shop/api/v1`
- **Auth:** all endpoints require `Authorization: Bearer {access_token}`
- **Product id format:** `com.bloodfitltd.bloodfit.{slug}.{monthly|yearly}`
- **Valid slugs:** `starter`, `pro`, `elite` (lowercase, URL-safe — enforced on plan create)

---

## Environment variables

Add these to `.env`. **Until the Apple/Google credentials are set, the backend
runs in TRUST MODE** (`IAP_TRUST_MODE=true`): it accepts the receipt the app
sends without calling the store, so the Flutter dev can test the full flow
immediately. Set real credentials + `IAP_TRUST_MODE=false` before production.

```env
IAP_BUNDLE_ID=com.bloodfitltd.bloodfit
IAP_TRUST_MODE=true

# Apple App Store (App Store Connect → App-Specific Shared Secret)
APPLE_SHARED_SECRET=

# Google Play (service account with Android Publisher API access)
GOOGLE_PLAY_PACKAGE_NAME=com.bloodfitltd.bloodfit
# provide ONE of the two:
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=
```

How verification resolves:
- **iOS** → Apple `verifyReceipt` (production, auto-retries sandbox on `21007`)
  using `APPLE_SHARED_SECRET`. Reads expiry + auto-renew from the receipt.
- **Android** → Google `purchases.subscriptions.get` (Android Publisher API)
  using the service account. Reads `expiryTimeMillis`, `paymentState`,
  `autoRenewing`.
- If credentials/receipt are missing and `IAP_TRUST_MODE=true` → trusted, expiry
  computed as now + 1 month/year. If `IAP_TRUST_MODE=false` → rejected.

---

## API 1 — Get plans

`GET /plan/plans` — Bearer token.

Non-admin callers receive only `isActive: true` plans. Returns plans with
`pricing.monthly/yearly`, `limits`, dynamic `features[].key/label/included`.

---

## API 2 — Billing summary

`GET /subscription/billing/{planId}/{billingType}` — Bearer token.
`billingType` = `monthly` | `yearly`. Returns subtotal/total (applies any
active promo code for the user).

---

## API 3 — Verify purchase (NEW)

`POST /subscription/verify-purchase` — Bearer token, `application/json`.

Called right after a successful purchase, and on restore (idempotent).

**Request:**
```json
{
  "platform": "ios",
  "planId": "69c36da9abb4640377a42d51",
  "planSlug": "elite",
  "billingType": "monthly",
  "productId": "com.bloodfitltd.bloodfit.elite.monthly",
  "transactionId": "1000000123456789",
  "purchaseToken": "google_purchase_token_here_for_android",
  "receiptData": "base64_apple_receipt_for_ios_optional"
}
```
- iOS: send `receiptData` and/or `transactionId`
- Android: send `purchaseToken` + `productId`

**Success — 200:**
```json
{
  "success": true,
  "status": 200,
  "message": "Subscription verified successfully",
  "data": {
    "isSubscribed": true,
    "planId": "69c36da9abb4640377a42d51",
    "planSlug": "elite",
    "planName": "Elite",
    "billingType": "monthly",
    "productId": "com.bloodfitltd.bloodfit.elite.monthly",
    "transactionId": "1000000123456789",
    "expiresAt": "2026-07-09T00:00:00.000Z",
    "isActive": true,
    "autoRenewing": true
  }
}
```

**Errors:**
- `400` invalid input / `productId` or `planSlug` mismatch / invalid or expired receipt
- `404` plan not found or inactive
- `409` receipt already linked to another account / duplicate receipt

```json
{ "success": false, "status": 400, "message": "Invalid or expired receipt" }
```

---

## API 4 — Subscription status (NEW)

`GET /subscription/status` — Bearer token.

Called on login, app launch, and after verify-purchase.

**Subscribed — 200:**
```json
{
  "success": true,
  "status": 200,
  "message": "Subscription status fetched",
  "data": {
    "isSubscribed": true,
    "planId": "69c36da9abb4640377a42d51",
    "planSlug": "elite",
    "planName": "Elite",
    "billingType": "monthly",
    "productId": "com.bloodfitltd.bloodfit.elite.monthly",
    "transactionId": "1000000123456789",
    "expiresAt": "2026-07-09T00:00:00.000Z",
    "isActive": true,
    "autoRenewing": true
  }
}
```

**Not subscribed — 200:**
```json
{
  "success": true,
  "status": 200,
  "message": "No active subscription",
  "data": {
    "isSubscribed": false,
    "planId": null,
    "planSlug": null,
    "planName": null,
    "billingType": null,
    "productId": null,
    "transactionId": null,
    "expiresAt": null,
    "isActive": false,
    "autoRenewing": false
  }
}
```

---

## API 5 — Promo code

`POST /promocode/add-promocode/{planId}` — Bearer token. (Unchanged.)

---

## Notes / not yet done

- **Webhooks** (Apple App Store Server Notifications V2 / Google RTDN) for
  renewal / cancellation / expiry / refund are **not** implemented yet. Until
  then, expiry is only refreshed when the app calls verify-purchase again. A
  cron job to mark `status: "expired"` once `endDate` passes is recommended.
- `transactionId` has a unique index → the same store transaction can never be
  recorded twice (across all users).
