import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const activities: any[] = [];

    // Get recent user registrations (last 3)
    const newUsers = await prisma.profile.findMany({
      select: { email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    newUsers.forEach((user) => {
      activities.push({
        id: `user-${user.email}`,
        type: 'new_user',
        message: `New user registered: ${user.email}`,
        time: formatTime(user.createdAt),
        timestamp: user.createdAt,
      });
    });

    // Get recent transactions (last 3)
    const transactions = await prisma.transaction.findMany({
      select: { 
        id: true, 
        profileId: true,
        createdAt: true, 
        status: true,
        profile: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    transactions.forEach((trans) => {
      activities.push({
        id: `transaction-${trans.id}`,
        type: 'download',
        message: `Payment from ${trans.profile?.email || 'unknown'} - ${trans.status}`,
        time: formatTime(trans.createdAt),
        timestamp: trans.createdAt,
      });
    });

    // Get recent subscriptions (last 2)
    const subscriptions = await prisma.subscription.findMany({
      select: { 
        id: true, 
        createdAt: true, 
        plan: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    subscriptions.forEach((sub) => {
      activities.push({
        id: `subscription-${sub.id}`,
        type: 'admin',
        message: `New subscription: ${sub.plan?.name || 'Unknown'} plan activated`,
        time: formatTime(sub.createdAt),
        timestamp: sub.createdAt,
      });
    });

    // Sort by timestamp descending and take top 6
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const sorted = activities.slice(0, 6);

    // Remove timestamp field for response
    const result = sorted.map(({ timestamp, ...rest }) => rest);

    return NextResponse.json({ activities: result });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
