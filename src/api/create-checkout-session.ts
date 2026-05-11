import Stripe from 'stripe';
import { supabase } from '../lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body; // Array of { id, quantity, price }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items' }), { status: 400 });
    }

    // Map items to Stripe format
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cart`,
      metadata: {
        // Store user ID if logged in
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}