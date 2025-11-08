import { NextRequest, NextResponse } from 'next/server';
import { RPC_URL } from '@/lib/config';

/**
 * API Route que actúa como proxy para las llamadas RPC
 * Esto evita problemas de CORS cuando se llama desde el navegador
 */
export async function POST(request: NextRequest) {
  try {
    const rpcUrl = RPC_URL;
    
    const body = await request.json();
    
    // Reenviar la petición a la RPC
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy RPC:', error);
    return NextResponse.json(
      { 
        error: 'Error al conectar con la RPC',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

