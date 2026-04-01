import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Get authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role from database
    const admin = await prisma.profile.findUnique({
      where: { email: user.email },
      select: { role: true, id: true }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }
    if (status && ['success', 'failed'].includes(status)) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.loginLog.count({ where });

    // Fetch login logs
    const logs = await prisma.loginLog.findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      },
      orderBy: {
        loginTime: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      profileId: log.profileId,
      fullName: log.profile?.fullName || 'Unknown User',
      email: log.email,
      status: log.status,
      ipAddress: log.ipAddress,
      device: log.device,
      loginTime: log.loginTime.toISOString(),
      createdAt: log.createdAt.toISOString()
    }));

    // Calculate stats for given filters
    const successCount = await prisma.loginLog.count({
      where: { ...where, status: 'success' }
    });
    const failedCount = await prisma.loginLog.count({
      where: { ...where, status: 'failed' }
    });

    return NextResponse.json({
      logs: formattedLogs,
      stats: {
        totalAttempts: total,
        successCount,
        failedCount,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, email, status = 'success', ipAddress, device } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    // Verify profile exists if profileId is provided
    if (profileId) {
      const profileExists = await prisma.profile.findUnique({
        where: { id: profileId }
      });

      if (!profileExists) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
    }

    // Create login log
    const loginLog = await prisma.loginLog.create({
      data: {
        profileId: profileId || null,
        email,
        status,
        ipAddress: ipAddress || null,
        device: device || null,
      }
    });

    return NextResponse.json(loginLog, { status: 201 });
  } catch (error) {
    console.error('Error creating login log:', error);
    return NextResponse.json(
      { error: 'Failed to create login log' },
      { status: 500 }
    );
  }
}
