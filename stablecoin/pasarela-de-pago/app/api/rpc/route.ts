import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

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

