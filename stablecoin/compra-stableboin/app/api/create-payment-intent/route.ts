import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeInstance();
    const { amount, walletAddress, tokenType = 'USDT' } = await request.json();

    // Validaciones
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Cantidad inválida' },
        { status: 400 }
      );
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Dirección de wallet inválida' },
        { status: 400 }
      );
    }

    // Validar tipo de token
    if (tokenType !== 'USDT' && tokenType !== 'EURT') {
      return NextResponse.json(
        { error: 'Tipo de token inválido. Debe ser USDT o EURT' },
        { status: 400 }
      );
    }

    // Determinar moneda y descripción según el tipo de token
    const currency = tokenType === 'EURT' ? 'eur' : 'usd';
    const tokenSymbol = tokenType === 'EURT' ? 'EURT' : 'USDT';
    
    // Convertir a centavos/céntimos (Stripe usa centavos)
    const amountInCents = Math.round(amount * 100);

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      metadata: {
        walletAddress,
        tokenAmount: amount.toString(),
        tokenType: tokenSymbol,
      },
      description: `Compra de ${amount} ${tokenSymbol}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error al crear el pago' },
      { status: 500 }
    );
  }
}

