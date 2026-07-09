-- Payments are invoice events, while a Stripe subscription can renew many times.
-- Keep the subscription id for lookup, but key idempotency by Stripe invoice id.
DROP INDEX IF EXISTS "Payment_stripeSubscriptionId_key";

CREATE UNIQUE INDEX "Payment_invoice_key" ON "Payment"("invoice");

CREATE INDEX "Payment_stripeSubscriptionId_idx" ON "Payment"("stripeSubscriptionId");
