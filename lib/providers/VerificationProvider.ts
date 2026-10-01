export type VerificationStatus = "self_declared" | "verified" | "expired" | "rejected";

export interface VerificationResult {
  status: VerificationStatus;
  providerName: string;
  verifiedAt?: Date;
  referenceId?: string;
  notes?: string;
}

export interface VerificationProvider {
  name: string;
  verifyDocument(
    type: string,
    documentNumber: string,
    additionalData?: Record<string, unknown>
  ): Promise<VerificationResult>;
}
