import { NextResponse } from 'next/server';
import { readDB, updateDB, issueSummary, addNotification } from '@/lib/db';

// A lightweight two-way conversation thread on the issue — either the
// card's creator OR the assigned moderator can post a message (asking a
// question, objecting, explaining context) without it changing the
// issue's status or the card's publication state. Just adds to the
// history and notifies whoever's on the other side of the conversation.
export async function POST(request, { params }) {
  const { id } = await params;
  const { userId, message } = await request.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'Bir mesaj yazmalısın.' }, { status: 400 });
  }

  const result = await updateDB((db) => {
    const issue = db.moderationIssues.find((i) => i.id === id);
    if (!issue) return { error: 'Issue bulunamadı.', status: 404 };
    const card = db.cards.find((c) => c.id === issue.cardId);
    if (!card) return { error: 'Kart bulunamadı.', status: 404 };

    const sender = db.users.find((u) => u.id === userId);
    const isCreator = card.creatorId === userId;
    const isAssignedModerator = issue.assignedModeratorId === userId;
    if (!isCreator && !isAssignedModerator) {
      return { error: 'Sadece kartın sahibi veya atanan moderatör yanıt gönderebilir.', status: 403 };
    }

    const now = new Date().toISOString();
    const roleLabel = isCreator ? "Creator'dan yanıt" : 'Moderatörden yanıt';
    issue.history.push({
      at: now,
      actor: sender?.displayName || (isCreator ? 'Creator' : 'Moderatör'),
      text: `${roleLabel}: "${message.trim()}"`,
    });
    issue.updatedAt = now;

    // Notify whoever's on the other side of the conversation.
    const notifyUserId = isCreator ? issue.assignedModeratorId : card.creatorId;
    if (notifyUserId) {
      addNotification(db, {
        userId: notifyUserId,
        type: isCreator ? 'creator_reply' : 'moderator_reply',
        title: isCreator ? 'Creator bir yanıt gönderdi' : 'Moderatörden yanıt geldi',
        body: `"${card.title}" kartı hakkında bir mesaj gönderildi: "${message.trim()}"`,
        link: isCreator ? `/management/moderation/${issue.id}` : `/bingo/${card.category}/${card.id}`,
      });
    }

    return { issue };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const db = await readDB();
  return NextResponse.json({ issue: issueSummary(result.issue, db) });
}
