/**
 * Small inline Lebanese flag (SVG, not emoji — Windows browsers don't render
 * flag emojis). Cedar touches both red bands, as on the real flag.
 */
export default function LebanonFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} role="img" aria-label="Lebanese flag">
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect width="30" height="5" y="0" fill="#EE161F" />
      <rect width="30" height="5" y="15" fill="#EE161F" />
      <g fill="#00A651">
        <polygon points="15,4.8 12.2,7.8 17.8,7.8" />
        <polygon points="15,6.6 10.9,10.1 19.1,10.1" />
        <polygon points="15,8.8 9.8,12.8 20.2,12.8" />
        <rect x="14.4" y="12.6" width="1.2" height="2.6" />
      </g>
    </svg>
  )
}
