import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Report, { REPORT_CATEGORIES } from '@/models/Report';

interface ReportStatsAggregate {
  totalReports: number;
  resolvedReports: number;
  averageResolutionDays: number | null;
  recentReports: Array<{
    _id: string;
    referenceCode: string;
    title: string;
    category: string;
    districtName: string;
    status: string;
    createdAt: Date;
  }>;
  topDistricts: Array<{
    name: string;
    reports: number;
    resolved: number;
    pending: number;
  }>;
  publicStats: {
    totalReports: number;
    districtCount: number;
  };
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  const status = request.nextUrl.searchParams.get('status');
  if (category && !REPORT_CATEGORIES.includes(category as typeof REPORT_CATEGORIES[number])) {
    return NextResponse.json({ error: 'Choose a valid report category' }, { status: 400 });
  }
  if (status && !['pending', 'under_review', 'resolved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Choose a valid report status' }, { status: 400 });
  }

  try {
    await connectDB();
    const [overview] = await Report.aggregate<{
      summary: Array<Omit<ReportStatsAggregate, 'recentReports' | 'topDistricts'>>;
      recentReports: ReportStatsAggregate['recentReports'];
      topDistricts: ReportStatsAggregate['topDistricts'];
      publicStats: ReportStatsAggregate['publicStats'][];
    }>([
      { $match: { isDemo: { $ne: true } } },
      {
        $facet: {
          publicStats: [
            {
              $match: {
                status: { $ne: 'rejected' },
                ...(category ? { category } : {}),
                ...(status ? { status } : {}),
              },
            },
            {
              $group: {
                _id: null,
                totalReports: { $sum: 1 },
                districts: { $addToSet: '$districtName' },
              },
            },
            {
              $project: {
                _id: 0,
                totalReports: 1,
                districtCount: { $size: '$districts' },
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalReports: { $sum: 1 },
                resolvedReports: {
                  $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
                },
                averageResolutionDays: {
                  $avg: {
                    $cond: [
                      { $eq: ['$status', 'resolved'] },
                      { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 86_400_000] },
                      null,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalReports: 1,
                resolvedReports: 1,
                averageResolutionDays: 1,
              },
            },
          ],
          recentReports: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                referenceCode: 1,
                title: 1,
                category: 1,
                districtName: 1,
                status: 1,
                createdAt: 1,
              },
            },
          ],
          topDistricts: [
            {
              $group: {
                _id: '$districtName',
                reports: { $sum: 1 },
                resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                pending: {
                  $sum: { $cond: [{ $in: ['$status', ['pending', 'under_review']] }, 1, 0] },
                },
              },
            },
            { $sort: { reports: -1, _id: 1 } },
            {
              $project: {
                _id: 0,
                name: '$_id',
                reports: 1,
                resolved: 1,
                pending: 1,
              },
            },
          ],
        },
      },
    ]);

    return NextResponse.json(
      {
        ...(overview?.summary[0] ?? {
          totalReports: 0,
          resolvedReports: 0,
          averageResolutionDays: null,
        }),
        recentReports: overview?.recentReports ?? [],
        topDistricts: overview?.topDistricts ?? [],
        publicStats: overview?.publicStats[0] ?? { totalReports: 0, districtCount: 0 },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[GET /api/reports/stats]', error);
    return NextResponse.json({ error: 'Failed to fetch report statistics' }, { status: 500 });
  }
}
