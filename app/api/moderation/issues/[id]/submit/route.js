import { NextResponse } from 'next/server';
import { readDB, updateDB, issueSummary, addNotification } from '@/lib/db';

export async function POST(request, { params }) {
  const { id } = await params;
  const { userId } = await request.json();

  const result = await updateDB((db) => {
    const issue = db.moderationIssues.find((i) => i.id === id);
    if (!issue) return { error: 'Issue bulunamadı.', status: 404 };
    const card = db.cards.find((c) => c.id === issue.cardId);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };
    if (card.creatorId !== userId) return { error: 'Sadece kartın sahibi incelemeye gönderebilir.', status: 403 };
    if (issue.status !== 'REVISION_REQUESTED') {
      return { error: 'Bu issue şu anda revizyon bekliyor durumunda değil.', status: 400 };
    }

    const creator = db.users.find((u) => u.id === userId);
    const now = new Date().toISOString();
    issue.status = 'PENDING_REVIEW';
    issue.updatedAt = now;
    issue.history.push({ at: now, actor: creator?.displayName || 'Creator', text: 'Creator değişiklikleri yaptı ve incelemeye gönderdi.' });
    card.publicationState = 'PENDING_REVIEW';
    // The edit grant is consumed on submit — the card is locked again until
    // the moderator reviews it (approve, or request revision once more).
    card.moderationEditGrant = null;

    if (issue.assignedModeratorId) {
      addNotification(db, {
        userId: issue.assignedModeratorId,
        type: 'submitted_for_review',
        title: 'Creator incelemeye gönderdi',
        body: `"${card.title}" kartı için istenen değişiklikler yapıldı, tekrar inceleme bekliyor.`,
        link: `/management/moderation/${issue.id}`,
      });
    }

    return { issue };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const db = await readDB();
  return NextResponse.json({ issue: issueSummary(result.issue, db) });
}
