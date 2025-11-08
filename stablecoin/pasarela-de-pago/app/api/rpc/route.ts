import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { RPC_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Realizar la llamada RPC
    const result = await provider.send(method, params || []);

    return NextResponse.json({
      jsonrpc: '2.0',
      result,
      id: body.id || 1,
    });
  } catch (error: any) {
    console.error('Error in RPC proxy:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal error',
        },
        id: 1,
      },
      { status: 500 }
    );
  }
}

