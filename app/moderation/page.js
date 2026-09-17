import { redirect } from 'next/navigation';

// Superseded by the fuller Management → Moderation area.
export default function LegacyModerationRedirect() {
  redirect('/management');
}
