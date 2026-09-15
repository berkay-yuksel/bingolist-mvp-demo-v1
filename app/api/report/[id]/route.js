import { NextResponse } from 'next/server';
import { updateDB } from '@/lib/db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();

  const result = await updateDB((db) => {
    const report = db.reports.find((r) => r.id === id);
    if (!report) return { error: true };
    report.status = status;
    return { report };
  });

  if (result.error) return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
  return NextResponse.json(result);
}
