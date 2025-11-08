import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ethers } from 'ethers';
import { EUR_TOKEN_ADDRESS, RPC_URL, USD_TOKEN_ADDRESS } from '@/lib/config';

function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET no está configurada');
  }
  return secret;
}

// ABI mínimo para mint (igual para ambos tokens)
const TOKEN_ABI = [
  'function mint(address to, uint256 amount) external',
];

async function mintTokens(
  walletAddress: string,
  amount: number,
  contractAddress: string,
  tokenType: string = 'USDT'
): Promise<string> {
  // Crear provider usando RPC URL
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // La clave privada del owner del contrato (debe estar en variables de entorno)
  const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
  if (!ownerPrivateKey) {
    throw new Error('OWNER_PRIVATE_KEY no configurada');
  }

  const wallet = new ethers.Wallet(ownerPrivateKey, provider);
  const contract = new ethers.Contract(contractAddress, TOKEN_ABI, wallet);

  // Convertir a tokens (1 USD/EUR = 1 USDT/EURT = 1e6 unidades base)
  const tokenAmount = ethers.parseUnits(amount.toString(), 6);

  // Ejecutar mint
  const tx = await contract.mint(walletAddress, tokenAmount);
  await tx.wait();

  console.log(`✅ Mint exitoso: ${amount} ${tokenType} a ${walletAddress}, tx: ${tx.hash}`);
  return tx.hash;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeInstance();
    const webhookSecret = getWebhookSecret();
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Falta la firma de Stripe' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Webhook signature verification failed:', errorMessage);
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

  // Manejar el evento
  console.log('📨 Evento recibido:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    console.log('💳 Payment Intent metadata:', paymentIntent.metadata);

    const walletAddress = paymentIntent.metadata.walletAddress;
    const tokenAmount = parseFloat(paymentIntent.metadata.tokenAmount || '0');
    const tokenType = paymentIntent.metadata.tokenType || 'USDT';
    
    // Obtener la dirección del contrato según el tipo de token
    const contractAddress = tokenType === 'EURT' ? EUR_TOKEN_ADDRESS : USD_TOKEN_ADDRESS;

    console.log('📋 Datos extraídos:', {
      walletAddress,
      tokenAmount,
      tokenType,
      contractAddress,
    });

    if (!walletAddress || !tokenAmount || !contractAddress) {
      console.error('❌ Faltan datos en el payment intent:', {
        walletAddress,
        tokenAmount,
        tokenType,
        contractAddress,
        metadata: paymentIntent.metadata,
      });
      return NextResponse.json(
        { error: 'Datos incompletos en el pago', metadata: paymentIntent.metadata },
        { status: 400 }
      );
    }

    try {
      console.log('Intentando acuñar tokens:', {
        walletAddress,
        tokenAmount,
        tokenType,
        contractAddress,
      });

      // Hacer mint de tokens
      const txHash = await mintTokens(walletAddress, tokenAmount, contractAddress, tokenType);
      
      console.log('✅ Tokens acuñados exitosamente:', {
        walletAddress,
        tokenAmount,
        tokenType,
        txHash,
      });

      return NextResponse.json({
        received: true,
        txHash,
        walletAddress,
        tokenAmount,
        tokenType,
      });
    } catch (error) {
      console.error('❌ Error minting tokens:', error);
      
      // Log detallado del error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // En producción, podrías querer marcar este pago para revisión
      // o intentar el mint nuevamente más tarde
      
      return NextResponse.json(
        { 
          error: 'Error al acuñar tokens',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        { status: 500 }
      );
    }
  } else {
    // Otros eventos (puedes agregar más según necesites)
    console.log(`Evento no manejado: ${event.type}`);
  }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}

