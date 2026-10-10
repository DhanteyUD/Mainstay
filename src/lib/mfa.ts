import { supabase } from "./supabase";

export interface TotpFactor {
  id: string;
  status: "verified" | "unverified";
}

export interface EnrollData {
  factorId: string;
  qr: string;
  secret: string;
}

const client = () => {
  if (!supabase) throw new Error("Authentication is not configured.");
  return supabase;
};

export async function getTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await client().auth.mfa.listFactors();
  if (error) throw error;
  return data.all
    .filter((f) => f.factor_type === "totp")
    .map((f) => ({ id: f.id, status: f.status as TotpFactor["status"] }));
}

export async function startEnroll(): Promise<EnrollData> {
  for (const f of (await getTotpFactors()).filter((f) => f.status === "unverified")) {
    await client().auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await client().auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Mainstay ${Date.now().toString(36)}`,
    issuer: "Mainstay",
  });
  if (error) throw error;
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyCode(
  factorId: string,
  code: string,
): Promise<void> {
  const { error } = await client().auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) throw error;
}

export async function removeFactor(factorId: string): Promise<void> {
  const { error } = await client().auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

export function friendlyMfaError(e: unknown): string {
  const m = ((e as Error)?.message ?? "").toLowerCase();
  if (m.includes("invalid") || m.includes("expired")) {
    return "That code didn't work. Check the code in your authenticator app and try again.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "Something went wrong. Please try again.";
}
