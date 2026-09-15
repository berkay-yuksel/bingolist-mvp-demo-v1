const PATTERNS = ['dots', 'grid', 'diagonal', 'rays'];

function patternFor(seed) {
  return PATTERNS[seed % PATTERNS.length];
}

// Deterministic, dependency-free cover art derived from the card's theme
// color + a numeric seed. Stands in for uploaded cover images in the demo,
// and doubles as the "ticket" motif that runs through the product.
export default function CardCover({ accent, seed = 0, title, image, className = '' }) {
  const safeAccent = accent || '#5F5E5A';
  if (image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title || ''} className="h-full w-full object-cover" />
      </div>
    );
  }

  const pattern = patternFor(seed);
  const id = `cov-${seed}-${pattern}`;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: '#0000' }}>
      <svg viewBox="0 0 320 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={safeAccent} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0F1320" stopOpacity="0.95" />
          </linearGradient>
          <pattern id={`${id}-p`} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform={pattern === 'diagonal' ? 'rotate(35)' : undefined}>
            {pattern === 'dots' && <circle cx="3" cy="3" r="1.6" fill="#F4EEDD" opacity="0.35" />}
            {pattern === 'grid' && <path d="M18 0H0V18" fill="none" stroke="#F4EEDD" strokeOpacity="0.25" />}
            {pattern === 'diagonal' && <path d="M0 18L18 0" stroke="#F4EEDD" strokeOpacity="0.28" strokeWidth="1.5" />}
            {pattern === 'rays' && <rect x="0" y="0" width="9" height="18" fill="#F4EEDD" opacity="0.06" />}
          </pattern>
        </defs>
        <rect width="320" height="200" fill={`url(#${id}-g)`} />
        <rect width="320" height="200" fill={`url(#${id}-p)`} />
        <circle cx="270" cy="40" r="70" fill="#F4EEDD" opacity="0.06" />
        <circle cx="40" cy="170" r="90" fill="#0F1320" opacity="0.18" />
      </svg>
    </div>
  );
}
