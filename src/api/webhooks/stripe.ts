import Stripe from 'stripe';
import { supabase } from '../../lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;
  const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Save order to Supabase
    await supabase.from('orders').insert({
      stripe_session_id: session.id,
      amount_total: session.amount_total,
      status: 'paid',
      // ... other fields
    });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}