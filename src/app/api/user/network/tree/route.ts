import { NextRequest, NextResponse } from 'next/server';
import networkData from '@/constants/json/network.json';

export async function GET(request: NextRequest) {
  // Simulate database latency
  await new Promise((resolve) => setTimeout(resolve, 150));

  return NextResponse.json(networkData.tree);
}
