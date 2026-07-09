export class PaymentStatusResponseDto {
  status: string;
  paymentStatus: string | null;
  total: number | null;
  currency: string | null;
  last4: string | null;
  created: Date | null;
  email?: string | null;
  isProcessed: boolean;
}
