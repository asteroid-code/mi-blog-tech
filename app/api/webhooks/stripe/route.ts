import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { cookies } from 'next/headers'; // Import cookies
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil', // Updated API version to match exact type
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed':
      const subscription: Stripe.Subscription = (await stripe.subscriptions.retrieve(session.subscription as string));
      const customerId = session.customer as string;
      const userId = session.metadata?.userId; // Assuming you pass userId in metadata

      if (!userId) {
        console.error('User ID not found in checkout session metadata.');
        return new NextResponse('User ID not found', { status: 400 });
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customerId,
          current_plan: subscription.items.data[0].price.lookup_key, // Assuming lookup_key is plan name
          subscription_status: subscription.status,
        })
        .eq('id', userId);

      // Insert subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          plan_type: subscription.items.data[0].price.lookup_key,
          status: subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        });
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const updatedSubscription: Stripe.Subscription = event.data.object as Stripe.Subscription;
      const customerIdForUpdate = updatedSubscription.customer as string;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerIdForUpdate)
        .single();

      if (profileError || !profileData) {
        console.error('Profile not found for customer ID:', customerIdForUpdate);
        return new NextResponse('Profile not found', { status: 400 });
      }
      const profileUserId = profileData.id;

      if (!profileUserId) {
        console.error('User ID not found in customer metadata for subscription update/delete.');
        return new NextResponse('User ID not found', { status: 400 });
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          current_plan: updatedSubscription.items.data[0].price.lookup_key,
          subscription_status: updatedSubscription.status,
        })
        .eq('id', profileUserId);

      // Update subscription
      await supabase
        .from('subscriptions')
        .update({
          plan_type: updatedSubscription.items.data[0].price.lookup_key,
          status: updatedSubscription.status,
          current_period_end: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', updatedSubscription.id);
      break;

    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  return new NextResponse('ok', { status: 200 });
}
