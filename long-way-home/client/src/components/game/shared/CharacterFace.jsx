/**
 * Procedural SVG character face — no image assets needed.
 * Parameterized by role (skin/hair color), mood (mouth shape), and health status (dot color).
 */

const ROLE_COLORS = {
  father:   { hair: '#4a3520', skin: '#d4a574', cheek: '#e8a090' },
  mother:   { hair: '#6a3a2a', skin: '#dbb090', cheek: '#e8a0a0' },
  son:      { hair: '#5a4030', skin: '#d4a574', cheek: '#e8a090' },
  daughter: { hair: '#8a5a3a', skin: '#dbb090', cheek: '#e8a0a0' },
  child:    { hair: '#6a4a30', skin: '#d4a574', cheek: '#e8a090' },
  elder:    { hair: '#9a9080', skin: '#cba080', cheek: '#d89888' },
  chaplain: { hair: '#3a3030', skin: '#c8a070', cheek: '#d89080' },
  default:  { hair: '#5a4030', skin: '#d4a574', cheek: '#e8a090' },
};

const STATUS_COLORS = {
  good:     '#4a7c59',
  fair:     '#c2873a',
  poor:     '#c2873a',
  critical: '#b94040',
  dead:     '#888888',
};

/**
 * Mouth SVG path based on mood.
 * Centered at (24, 30) for a 48px viewBox.
 */
function getMouthPath(mood) {
  switch (mood) {
    case 'happy':   return 'M 18 30 Q 24 35 30 30';
    case 'neutral': return 'M 19 31 L 29 31';
    case 'worried': return 'M 18 33 Q 24 30 30 33';
    case 'grim':    return 'M 19 33 L 24 31 L 29 33';
    default:        return 'M 19 31 L 29 31';
  }
}

function getMood(health, morale) {
  if (health === 'dead') return 'grim';
  if (health === 'critical' || morale < 25) return 'grim';
  if (health === 'poor' || morale < 50) return 'worried';
  if (morale >= 75) return 'happy';
  return 'neutral';
}

function getRole(member) {
  if (member.isChaplain) return 'chaplain';
  if (member.isPlayer) {
    return member.gender === 'female' ? 'mother' : 'father';
  }
  if (member.age && member.age < 13) {
    return member.gender === 'female' ? 'daughter' : 'child';
  }
  if (member.age && member.age > 55) return 'elder';
  if (member.gender === 'female') return 'daughter';
  return 'son';
}

export default function CharacterFace({ member, size = 48 }) {
  const role = getRole(member);
  const colors = ROLE_COLORS[role] || ROLE_COLORS.default;
  const mood = getMood(member.health, member.morale ?? 70);
  const statusColor = STATUS_COLORS[member.health] || STATUS_COLORS.good;
  const isDead = member.health === 'dead' || !member.alive;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ flexShrink: 0, opacity: isDead ? 0.45 : 1, filter: isDead ? 'grayscale(0.8)' : 'none' }}
    >
      {/* Hair (ellipse behind head) */}
      <ellipse cx="24" cy="18" rx="16" ry="15" fill={colors.hair} />

      {/* Face */}
      <ellipse cx="24" cy="22" rx="13" ry="14" fill={colors.skin} />

      {/* Cheeks */}
      <ellipse cx="16" cy="26" rx="3.5" ry="2.5" fill={colors.cheek} opacity="0.4" />
      <ellipse cx="32" cy="26" rx="3.5" ry="2.5" fill={colors.cheek} opacity="0.4" />

      {/* Eyes */}
      <ellipse cx="19" cy="22" rx="2.5" ry="2.8" fill="#2c1f14" />
      <ellipse cx="29" cy="22" rx="2.5" ry="2.8" fill="#2c1f14" />

      {/* Eye shine */}
      <circle cx="20" cy="21" r="1" fill="white" />
      <circle cx="30" cy="21" r="1" fill="white" />

      {/* Mouth */}
      <path d={getMouthPath(mood)} fill="none" stroke="#5a3020" strokeWidth="1.5" strokeLinecap="round" />

      {/* Status dot (top-right) */}
      <circle cx="40" cy="8" r="4.5" fill={statusColor} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
