/**
 * Procedural SVG character face — no image assets needed.
 * Parameterized by role (skin/hair color), mood (mouth shape), health status (dot color),
 * and age group (child/teen/adult/elder) for visual details.
 */

const ROLE_COLORS = {
  father:   { hair: '#4a3520', skin: '#d4a574', cheek: '#e8a090' },
  mother:   { hair: '#6a3a2a', skin: '#dbb090', cheek: '#e8a0a0' },
  son:      { hair: '#5a4030', skin: '#d4a574', cheek: '#e8a090' },
  daughter: { hair: '#8a5a3a', skin: '#dbb090', cheek: '#e8a0a0' },
  teen_m:   { hair: '#5a4030', skin: '#d4a574', cheek: '#e8a090' },
  teen_f:   { hair: '#7a4a2a', skin: '#dbb090', cheek: '#e8a0a0' },
  child:    { hair: '#6a4a30', skin: '#d4a574', cheek: '#f0b0a0' },
  elder:    { hair: '#b0a898', skin: '#cba080', cheek: '#d89888' },
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

function getAgeGroup(age) {
  if (!age || age < 13) return 'child';
  if (age < 18) return 'teen';
  if (age < 55) return 'adult';
  return 'elder';
}

function getRole(member) {
  if (member.isChaplain) return 'chaplain';
  const ageGroup = getAgeGroup(member.age);

  if (ageGroup === 'child') return 'child';
  if (ageGroup === 'teen') return member.gender === 'female' ? 'teen_f' : 'teen_m';
  if (ageGroup === 'elder') return 'elder';

  // Adult
  if (member.isPlayer) {
    return member.gender === 'female' ? 'mother' : 'father';
  }
  return member.gender === 'female' ? 'daughter' : 'son';
}

export default function CharacterFace({ member, size = 48 }) {
  const role = getRole(member);
  const ageGroup = getAgeGroup(member.age);
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

      {/* Elder: gray streaks in hair */}
      {ageGroup === 'elder' && (
        <>
          <path d="M12,14 Q16,10 20,13" stroke="#d0ccc4" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M28,13 Q32,10 36,14" stroke="#d0ccc4" strokeWidth="1.2" fill="none" opacity="0.7" />
        </>
      )}

      {/* Face — children have rounder faces */}
      {ageGroup === 'child' ? (
        <ellipse cx="24" cy="23" rx="12" ry="13" fill={colors.skin} />
      ) : (
        <ellipse cx="24" cy="22" rx="13" ry="14" fill={colors.skin} />
      )}

      {/* Cheeks — children have rosier, bigger cheeks */}
      <ellipse cx="16" cy="26" rx={ageGroup === 'child' ? 4 : 3.5} ry={ageGroup === 'child' ? 3 : 2.5}
        fill={colors.cheek} opacity={ageGroup === 'child' ? 0.55 : 0.4} />
      <ellipse cx="32" cy="26" rx={ageGroup === 'child' ? 4 : 3.5} ry={ageGroup === 'child' ? 3 : 2.5}
        fill={colors.cheek} opacity={ageGroup === 'child' ? 0.55 : 0.4} />

      {/* Eyes — children have bigger rounder eyes, elders have narrower eyes */}
      {ageGroup === 'child' ? (
        <>
          <ellipse cx="19" cy="22" rx="3" ry="3.2" fill="#2c1f14" />
          <ellipse cx="29" cy="22" rx="3" ry="3.2" fill="#2c1f14" />
          <circle cx="20" cy="21" r="1.3" fill="white" />
          <circle cx="30" cy="21" r="1.3" fill="white" />
        </>
      ) : ageGroup === 'elder' ? (
        <>
          <ellipse cx="19" cy="22" rx="2.5" ry="2.2" fill="#2c1f14" />
          <ellipse cx="29" cy="22" rx="2.5" ry="2.2" fill="#2c1f14" />
          <circle cx="20" cy="21.5" r="0.8" fill="white" />
          <circle cx="30" cy="21.5" r="0.8" fill="white" />
          {/* Crow's feet wrinkles */}
          <path d="M12,21 L14,22" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M12,23 L14,22.5" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M36,21 L34,22" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M36,23 L34,22.5" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
        </>
      ) : ageGroup === 'teen' ? (
        <>
          <ellipse cx="19" cy="22" rx="2.8" ry="3" fill="#2c1f14" />
          <ellipse cx="29" cy="22" rx="2.8" ry="3" fill="#2c1f14" />
          <circle cx="20" cy="21" r="1.1" fill="white" />
          <circle cx="30" cy="21" r="1.1" fill="white" />
        </>
      ) : (
        <>
          <ellipse cx="19" cy="22" rx="2.5" ry="2.8" fill="#2c1f14" />
          <ellipse cx="29" cy="22" rx="2.5" ry="2.8" fill="#2c1f14" />
          <circle cx="20" cy="21" r="1" fill="white" />
          <circle cx="30" cy="21" r="1" fill="white" />
        </>
      )}

      {/* Teen: slight eyebrow emphasis */}
      {ageGroup === 'teen' && (
        <>
          <path d="M16,18.5 Q19,17 22,18.5" stroke="#3a2a1a" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M26,18.5 Q29,17 32,18.5" stroke="#3a2a1a" strokeWidth="1" fill="none" opacity="0.5" />
        </>
      )}

      {/* Mouth */}
      <path d={getMouthPath(mood)} fill="none" stroke="#5a3020" strokeWidth="1.5" strokeLinecap="round" />

      {/* Child: freckles */}
      {ageGroup === 'child' && (
        <>
          <circle cx="17" cy="28" r="0.7" fill="#c09070" opacity="0.5" />
          <circle cx="20" cy="27" r="0.7" fill="#c09070" opacity="0.5" />
          <circle cx="28" cy="27" r="0.7" fill="#c09070" opacity="0.5" />
          <circle cx="31" cy="28" r="0.7" fill="#c09070" opacity="0.5" />
        </>
      )}

      {/* Status dot (top-right) */}
      <circle cx="40" cy="8" r="4.5" fill={statusColor} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
