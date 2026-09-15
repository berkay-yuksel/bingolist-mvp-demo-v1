import { NextResponse } from 'next/server';
import { readDB, updateDB, issueSummary, hasRole, addNotification } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const creatorId = searchParams.get('creatorId');

  const db = await readDB();
  let issues = db.moderationIssues;
  if (status && status !== 'all') issues = issues.filter((i) => i.status === status);
  if (creatorId) {
    issues = issues.filter((i) => db.cards.find((c) => c.id === i.cardId)?.creatorId === creatorId);
  }

  const sorted = [...issues].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return NextResponse.json({ issues: sorted.map((i) => issueSummary(i, db)) });
}

// Creating an issue is the "a moderator notices a problem and opens it"
// step from the workflow — it immediately assigns the issue to the
// creating moderator and puts the card under review.
export async function POST(request) {
  const { cardId, moderatorId, reason, message, reportId } = await request.json();
  if (!cardId || !moderatorId || !reason) {
    return NextResponse.json({ error: 'cardId, moderatorId ve reason gerekli.' }, { status: 400 });
  }

  const result = await updateDB((db) => {
    const moderator = db.users.find((u) => u.id === moderatorId);
    if (!moderator || !hasRole(moderator, ['moderator'])) {
      return { error: 'Sadece moderatörler issue oluşturabilir.', status: 403 };
    }
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };

    const now = new Date().toISOString();
    const issue = {
      id: `issue_${Date.now()}`,
      cardId,
      status: 'UNDER_REVIEW',
      assignedModeratorId: moderatorId,
      reason,
      message: message || '',
      request: '',
      reportId: reportId || null,
      createdAt: now,
      updatedAt: now,
      history: [{ at: now, actor: moderator.displayName, text: `Issue oluşturuldu ve incelemeye alındı.` }],
    };
    db.moderationIssues.push(issue);
    card.publicationState = 'UNDER_REVIEW';

    addNotification(db, {
      userId: card.creatorId,
      type: 'issue_opened',
      title: 'Kartın incelemeye alındı',
      body: `"${card.title}" kartı bir moderatör tarafından incelemeye alındı.`,
      link: `/management/moderation/${issue.id}`,
    });

    if (reportId) {
      const report = db.reports.find((r) => r.id === reportId);
      if (report) {
        report.status = 'converted';
        report.issueId = issue.id;
      }
    }

    return { issue };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const db = await readDB();
  return NextResponse.json({ issue: issueSummary(result.issue, db) }, { status: 201 });
}
