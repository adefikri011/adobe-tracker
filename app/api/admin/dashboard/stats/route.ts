import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get count of total assets
    const totalAssets = await prisma.asset.count();

    // Get sum of downloads from all assets
    const downloadsData = await prisma.asset.aggregate({
      _sum: {
        downloads: true,
      },
    });
    const totalDownloads = downloadsData._sum?.downloads || 0;

    // Get sum of earnings from assets (creators earnings)
    const assetEarningsData = await prisma.asset.aggregate({
      _sum: {
        earnings: true,
      },
    });

    // Get only successful transactions to sum amounts
    const allTransactionsData = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'success',
      },
    });

    // Only use transaction amount for total earning
    const assetEarnings = assetEarningsData._sum?.earnings || 0;
    const transactionAmount = allTransactionsData._sum?.amount || 0;
    const totalEarning = transactionAmount;

    console.log('Dashboard Stats:', {
      totalAssets,
      totalDownloads,
      assetEarnings,
      transactionAmount,
      totalEarning,
    });

    return NextResponse.json({
      totalDownloads,
      totalAssets,
      totalEarning,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
