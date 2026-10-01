import { VerificationProvider, VerificationResult } from "./VerificationProvider";

/**
 * ManualProvider represents user-entered documents without external official API verification.
 * In accordance with DPDP principles and Section 1, documents verified by ManualProvider are always
 * marked with status "self_declared".
 */
export class ManualProvider implements VerificationProvider {
  public name = "Manual Self-Declaration";

  async verifyDocument(
    type: string,
    documentNumber: string,
    additionalData?: Record<string, unknown>
  ): Promise<VerificationResult> {
    return {
      status: "self_declared",
      providerName: this.name,
      verifiedAt: new Date(),
      notes: "Document was entered by the wallet holder without third-party institutional verification.",
    };
  }
}
