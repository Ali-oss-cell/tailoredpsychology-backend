export type StripeCheckoutSessionPayload = {
  id: string;
  url?: string | null;
  status?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
};

export type StripeWebhookPayload = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSessionPayload;
  };
};
