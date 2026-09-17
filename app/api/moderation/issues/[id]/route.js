import { NextResponse } from 'next/server';
import { readDB, updateDB, issueSummary, addNotification } from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  const db = await readDB();
  const issue = db.moderationIssues.find((i) => i.id === id);
  if (!issue) return NextResponse.json({ error: 'Issue bulunamadı.' }, { status: 404 });

  const card = db.cards.find((c) => c.id === issue.cardId);
  return NextResponse.json({ issue: issueSummary(issue, db), card: card || null });
}

// Moderator actions on an issue. All actions require the acting moderator
// to be the one currently assigned — this is what stops two moderators
// from working the same issue at once.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { moderatorId, action } = body;

  const result = await updateDB((db) => {
    const issue = db.moderationIssues.find((i) => i.id === id);
    if (!issue) return { error: 'Issue bulunamadı.', status: 404 };
    const moderator = db.users.find((u) => u.id === moderatorId);
    if (!moderator) return { error: 'Moderatör bulunamadı.', status: 404 };
    if (issue.assignedModeratorId && issue.assignedModeratorId !== moderatorId) {
      return { error: `Bu issue zaten @${db.users.find((u) => u.id === issue.assignedModeratorId)?.username} tarafından üstlenilmiş.`, status: 403 };
    }
    const card = db.cards.find((c) => c.id === issue.cardId);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };

    const now = new Date().toISOString();
    const log = (text) => issue.history.push({ at: now, actor: moderator.displayName, text });

    if (action === 'resolve') {
      if (issue.status === 'RESOLVED') {
        return { error: 'Bu issue zaten çözülmüş.', status: 400 };
      }
      const wasRevisionRequested = issue.status === 'REVISION_REQUESTED';
      issue.status = 'RESOLVED';
      card.publicationState = 'PUBLISHED';
      card.moderationEditGrant = null;
      log(
        wasRevisionRequested
          ? 'Revizyon talebi iptal edildi, issue çözüldü, kart tekrar yayında.'
          : 'Sorun bulunamadı, issue çözüldü, kart yayında.'
      );
      addNotification(db, {
        userId: card.creatorId,
        type: 'issue_resolved',
        title: 'Kartın incelemesi tamamlandı',
        body: wasRevisionRequested
          ? `"${card.title}" kartı için revizyon talebi iptal edildi, kart tekrar yayında.`
          : `"${card.title}" kartında sorun bulunamadı, yeniden yayında.`,
        link: `/management/moderation/${issue.id}`,
      });
    } else if (action === 'request_revision') {
      if (!['UNDER_REVIEW', 'PENDING_REVIEW'].includes(issue.status)) {
        return { error: 'Bu durumda revizyon istenemez.', status: 400 };
      }
      if (!body.request) return { error: 'Creator için bir "request" (talep) metni gerekli.', status: 400 };
      issue.status = 'REVISION_REQUESTED';
      issue.request = body.request;
      if (body.message !== undefined) issue.message = body.message;
      card.publicationState = 'UNPUBLISHED';
      card.moderationEditGrant = { issueId: issue.id, grantedAt: now };
      log(`Revizyon istendi ve kart yayından kaldırıldı. Talep: "${body.request}"`);
      addNotification(db, {
        userId: card.creatorId,
        type: 'revision_requested',
        title: 'Kartın için revizyon isteniyor',
        body: `"${card.title}" kartı yayından kaldırıldı. Talep: "${body.request}"`,
        link: `/management/moderation/${issue.id}`,
      });
    } else if (action === 'approve') {
      if (issue.status !== 'PENDING_REVIEW') {
        return { error: 'Sadece incelemeyi bekleyen bir revizyon onaylanabilir.', status: 400 };
      }
      issue.status = 'RESOLVED';
      card.publicationState = 'PUBLISHED';
      card.moderationEditGrant = null;
      log('Revizyon onaylandı, kart tekrar yayında.');
      addNotification(db, {
        userId: card.creatorId,
        type: 'revision_approved',
        title: 'Revizyonun onaylandı',
        body: `"${card.title}" kartı tekrar yayında.`,
        link: `/management/moderation/${issue.id}`,
      });
    } else {
      return { error: 'Geçersiz aksiyon.', status: 400 };
    }

    issue.assignedModeratorId = moderatorId;
    issue.updatedAt = now;
    return { issue };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const db = await readDB();
  return NextResponse.json({ issue: issueSummary(result.issue, db) });
}
