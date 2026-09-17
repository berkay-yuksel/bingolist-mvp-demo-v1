import { Eye, Users, Repeat, Share2 } from 'lucide-react';
import { formatCount } from '@/lib/format';

export default function MetricsRow({ metrics }) {
  const items = [
    { icon: Eye, label: 'Görüntülenme', value: metrics.views },
    { icon: Users, label: 'Oyuncu', value: metrics.uniquePlayers },
    { icon: Repeat, label: 'Remix', value: metrics.remixes },
    { icon: Share2, label: 'Paylaşım', value: metrics.shares },
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-xs text-paper/55">
      {items.map(({ icon: Icon, label, value }) => (
        <span key={label} className="flex items-center gap-1.5" title={label}>
          <Icon size={13} /> {formatCount(value)}
        </span>
      ))}
    </div>
  );
}
