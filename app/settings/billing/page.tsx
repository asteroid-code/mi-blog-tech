'use client'; // Add use client directive

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { plans, Plan } from '@/lib/plans';
import Stripe from 'stripe'; // Import Stripe here for server actions

export default async function BillingPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-semibold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">Por favor, inicia sesión para gestionar tu plan.</p>
        <Button asChild>
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_plan, subscription_status, stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-semibold mb-4">Error al cargar el perfil</h1>
        <p className="text-muted-foreground mb-6">No se pudo cargar la información de tu plan. Inténtalo de nuevo más tarde.</p>
      </div>
    );
  }

  const currentPlan: Plan | undefined = plans.find((p: Plan) => p.lookup_key === profile.current_plan) || plans.find((p: Plan) => p.lookup_key === 'free');

  // Function to create a Stripe Checkout Session
  const createCheckoutSession = async (priceId: string) => {
    'use server';
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing?canceled=true`,
      customer: profile.stripe_customer_id || undefined, // Use existing customer if available
      metadata: {
        userId: user.id,
      },
    });
    return session.url;
  };

  // Function to create a Stripe Customer Portal Session
  const createCustomerPortalSession = async () => {
    'use server';
    if (!profile.stripe_customer_id) {
      throw new Error('Stripe Customer ID not found.');
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing`,
    });
    return session.url;
  };

  return (
    <div className="flex-1 p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Gestionar tu Plan</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tu Plan Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold">{currentPlan?.name}</p>
          <p className="text-muted-foreground">Estado de la suscripción: {profile.subscription_status}</p>
          {profile.stripe_customer_id && (
            <Button
              onClick={async () => {
                const portalUrl = await createCustomerPortalSession();
                if (portalUrl) {
                  window.location.href = portalUrl;
                }
              }}
              className="mt-4"
            >
              Gestionar Suscripción
            </Button>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-3">Cambiar tu Plan</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan: Plan) => (
          <Card key={plan.lookup_key}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-bold">{plan.price}</p>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside mb-4">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              {plan.lookup_key === profile.current_plan ? (
                <Button disabled>Plan Actual</Button>
              ) : (
                <Button
                  onClick={async () => {
                    const checkoutUrl = await createCheckoutSession(plan.price_id);
                    if (checkoutUrl) {
                      window.location.href = checkoutUrl;
                    }
                  }}
                >
                  Seleccionar Plan
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
