import axios from "axios";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";
import {
  APPLE_SHARED_SECRET,
  GOOGLE_PLAY_PACKAGE_NAME,
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
  GOOGLE_PLAY_SERVICE_ACCOUNT_PATH,
  IAP_TRUST_MODE,
} from "../../config";
import { BillingCycle } from "./subscription.interface";

const APPLE_PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

export interface VerificationResult {
  valid: boolean;
  // Resolved expiry of the subscription (when known from the store)
  expiresAt: Date;
  autoRenewing: boolean;
  // Normalised transaction id we will persist + de-dupe on
  transactionId?: string;
  // Whether we actually reached the store or fell back to trust mode
  verifiedByStore: boolean;
  message?: string;
  raw?: any;
}

// Fallback expiry when the store doesn't give us one (or trust mode is on)
const computeFallbackExpiry = (billingType: BillingCycle): Date => {
  const expiry = new Date();
  if (billingType === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
};

// ─────────────────────────────────────────────────────────────
// Apple App Store — verifyReceipt
// ─────────────────────────────────────────────────────────────
const callAppleVerify = async (receiptData: string, url: string) => {
  const { data } = await axios.post(url, {
    "receipt-data": receiptData,
    password: APPLE_SHARED_SECRET,
    "exclude-old-transactions": true,
  });
  return data;
};

export const verifyApplePurchase = async (input: {
  receiptData?: string;
  transactionId?: string;
  productId?: string;
  billingType: BillingCycle;
}): Promise<VerificationResult> => {
  const { receiptData, transactionId, productId, billingType } = input;

  // No shared secret OR no receipt → trust mode (dev convenience)
  if (!APPLE_SHARED_SECRET || !receiptData) {
    if (!IAP_TRUST_MODE) {
      return {
        valid: false,
        expiresAt: new Date(),
        autoRenewing: false,
        verifiedByStore: false,
        message:
          "Apple verification not configured (missing shared secret or receiptData)",
      };
    }
    return {
      valid: true,
      expiresAt: computeFallbackExpiry(billingType),
      autoRenewing: true,
      transactionId: transactionId || `apple_${Date.now()}`,
      verifiedByStore: false,
      message: "TRUST MODE: Apple receipt accepted without store verification",
    };
  }

  try {
    // Always try production first; 21007 means it's a sandbox receipt
    let data = await callAppleVerify(receiptData, APPLE_PROD_URL);
    if (data?.status === 21007) {
      data = await callAppleVerify(receiptData, APPLE_SANDBOX_URL);
    }

    if (data?.status !== 0) {
      return {
        valid: false,
        expiresAt: new Date(),
        autoRenewing: false,
        verifiedByStore: true,
        message: `Apple verification failed (status ${data?.status})`,
        raw: data,
      };
    }

    // Pick the latest receipt info for this product (or the latest overall)
    const infos: any[] =
      data.latest_receipt_info || data.receipt?.in_app || [];
    const relevant = productId
      ? infos.filter((i) => i.product_id === productId)
      : infos;
    const latest = (relevant.length ? relevant : infos).sort(
      (a, b) => Number(b.expires_date_ms || 0) - Number(a.expires_date_ms || 0),
    )[0];

    if (!latest) {
      return {
        valid: false,
        expiresAt: new Date(),
        autoRenewing: false,
        verifiedByStore: true,
        message: "Apple receipt contained no matching transaction",
        raw: data,
      };
    }

    const expiresAt = latest.expires_date_ms
      ? new Date(Number(latest.expires_date_ms))
      : computeFallbackExpiry(billingType);

    const pending = data.pending_renewal_info?.find(
      (p: any) => p.product_id === latest.product_id,
    );
    const autoRenewing = pending ? pending.auto_renew_status === "1" : true;

    return {
      valid: expiresAt.getTime() > Date.now(),
      expiresAt,
      autoRenewing,
      transactionId:
        latest.original_transaction_id || latest.transaction_id || transactionId,
      verifiedByStore: true,
      raw: latest,
    };
  } catch (err: any) {
    console.error("Apple verifyReceipt error:", err?.message || err);
    return {
      valid: false,
      expiresAt: new Date(),
      autoRenewing: false,
      verifiedByStore: true,
      message: "Apple verification request failed",
    };
  }
};

// ─────────────────────────────────────────────────────────────
// Google Play — Android Publisher API (purchases.subscriptions.get)
// ─────────────────────────────────────────────────────────────
let cachedGoogleAuth: GoogleAuth | null = null;

const getGoogleAuth = (): GoogleAuth | null => {
  if (cachedGoogleAuth) return cachedGoogleAuth;

  let credentials: any | undefined;
  try {
    if (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
      credentials = JSON.parse(GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
    } else if (
      GOOGLE_PLAY_SERVICE_ACCOUNT_PATH &&
      fs.existsSync(GOOGLE_PLAY_SERVICE_ACCOUNT_PATH)
    ) {
      credentials = JSON.parse(
        fs.readFileSync(GOOGLE_PLAY_SERVICE_ACCOUNT_PATH, "utf-8"),
      );
    }
  } catch (err) {
    console.error("Failed to load Google Play service account:", err);
    return null;
  }

  if (!credentials) return null;

  cachedGoogleAuth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  return cachedGoogleAuth;
};

export const verifyGooglePurchase = async (input: {
  purchaseToken?: string;
  productId?: string;
  transactionId?: string;
  billingType: BillingCycle;
}): Promise<VerificationResult> => {
  const { purchaseToken, productId, transactionId, billingType } = input;

  const auth = getGoogleAuth();

  // No credentials OR no token → trust mode (dev convenience)
  if (!auth || !purchaseToken || !productId) {
    if (!IAP_TRUST_MODE) {
      return {
        valid: false,
        expiresAt: new Date(),
        autoRenewing: false,
        verifiedByStore: false,
        message:
          "Google verification not configured (missing service account, purchaseToken or productId)",
      };
    }
    return {
      valid: true,
      expiresAt: computeFallbackExpiry(billingType),
      autoRenewing: true,
      transactionId: transactionId || purchaseToken || `google_${Date.now()}`,
      verifiedByStore: false,
      message:
        "TRUST MODE: Google purchase accepted without store verification",
    };
  }

  try {
    const client = await auth.getClient();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
      GOOGLE_PLAY_PACKAGE_NAME,
    )}/purchases/subscriptions/${encodeURIComponent(
      productId,
    )}/tokens/${encodeURIComponent(purchaseToken)}`;

    const res: any = await client.request({ url, method: "GET" });
    const data = res.data;

    // expiryTimeMillis is a string of epoch millis
    const expiresAt = data.expiryTimeMillis
      ? new Date(Number(data.expiryTimeMillis))
      : computeFallbackExpiry(billingType);

    // paymentState: 0 pending, 1 received, 2 free trial, 3 deferred
    const paid = data.paymentState === 1 || data.paymentState === 2;

    return {
      valid: paid && expiresAt.getTime() > Date.now(),
      expiresAt,
      autoRenewing: !!data.autoRenewing,
      transactionId: data.orderId || transactionId || purchaseToken,
      verifiedByStore: true,
      raw: data,
    };
  } catch (err: any) {
    console.error(
      "Google Play verification error:",
      err?.response?.data || err?.message || err,
    );
    return {
      valid: false,
      expiresAt: new Date(),
      autoRenewing: false,
      verifiedByStore: true,
      message: "Google Play verification request failed",
    };
  }
};
