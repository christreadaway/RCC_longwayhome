/**
 * Procedural SVG character portrait — 1840s frontier era.
 * Parameterized by role (skin/hair/hat), mood (mouth shape), health status (dot + saturation),
 * age group (child/teen/adult/elder), and chaplain flag for period clergy.
 * All shapes are SVG primitives — no external images or fonts.
 */

// ── Trait pools for procedural variety (15+ combos per gender) ──────────

const SKIN_TONES = [
  '#D4A574', '#DEB090', '#C8A070', '#E0BB94', '#CCA480',
  '#D8B088', '#C49A6C', '#E4C098', '#D0A878', '#DCAE84',
  '#C89870', '#D6B490', '#D0AA7C', '#E0B890', '#C8A478',
];

const HAIR_MALE = [
  '#4a3520', '#5C4033', '#3a2a18', '#6a4a30', '#2a1a10',
  '#5a3828', '#4a3018', '#3a2820', '#6a5038', '#504030',
  '#483020', '#5a4028', '#3a2010', '#604838', '#4a3828',
];

const HAIR_FEMALE = [
  '#6a3a2a', '#8a5a3a', '#7a4a2a', '#5a3020', '#9a6a48',
  '#6a4028', '#8a5030', '#7a3a20', '#6a4a38', '#A07050',
  '#804830', '#6a3828', '#8a6040', '#704028', '#886048',
];

const HAT_MALE = [
  '#3a2a1a', '#2a2020', '#4a3a28', '#302018', '#3a3028',
  '#2a1a10', '#4a3020', '#382818', '#342820', '#3a2820',
  '#2a2018', '#4a3828', '#302820', '#3a3020', '#282018',
];

const BONNET_COLORS = [
  { bonnet: '#f0e6d0', tie: '#c0a070' },
  { bonnet: '#e8dcc0', tie: '#b89860' },
  { bonnet: '#f4ece0', tie: '#c8a878' },
  { bonnet: '#ece0c8', tie: '#a89058' },
  { bonnet: '#f0e8d8', tie: '#b8a068' },
  { bonnet: '#e8e0d0', tie: '#a89060' },
  { bonnet: '#f2ead4', tie: '#c0a870' },
  { bonnet: '#e6dcc4', tie: '#b09058' },
  { bonnet: '#eee4cc', tie: '#c0a068' },
  { bonnet: '#f0e4c8', tie: '#b89860' },
  { bonnet: '#e4dac0', tie: '#a88850' },
  { bonnet: '#f4ecd8', tie: '#c8a878' },
  { bonnet: '#e8dcc8', tie: '#a89060' },
  { bonnet: '#efe5d0', tie: '#b8a068' },
  { bonnet: '#e6dcc0', tie: '#a08850' },
];

const SHIRT_MALE = [
  '#5a4a3a', '#6a5a48', '#4a3a2a', '#5a5040', '#6a5040',
  '#504030', '#5a4838', '#4a4030', '#604a38', '#504838',
  '#5a5038', '#4a3828', '#5a4a40', '#604838', '#504030',
];

const SHIRT_FEMALE = [
  '#7a6a5a', '#6a6058', '#7a7060', '#685848', '#706050',
  '#786858', '#6a5848', '#706858', '#7a6a58', '#685a48',
  '#786a58', '#6a5a50', '#706050', '#786858', '#6a6050',
];

const CHILD_SHIRT_MALE = [
  '#6a8a9a', '#7a8a7a', '#8a7a6a', '#6a7a8a', '#7a8a8a',
  '#6a8a7a', '#7a7a8a', '#8a8a7a', '#6a7a7a', '#7a8a6a',
  '#6a8a8a', '#7a7a7a', '#8a7a7a', '#6a7a6a', '#7a8a7a',
];

const CHILD_SHIRT_FEMALE = [
  '#a8c4a0', '#b0a8c0', '#c0a8a0', '#a0b8c0', '#b8b0a0',
  '#a8b8a8', '#b0a8b0', '#c0b0a0', '#a0c0b0', '#b8a8a0',
  '#a8c0b0', '#b0b0a8', '#c0a8a8', '#a0b0b8', '#b8b0a8',
];

const RIBBON_COLORS = [
  '#9e422c', '#8a3a5a', '#4a5a8a', '#6a7a3a', '#8a6a2a',
  '#7a3040', '#5a4a7a', '#3a6a5a', '#9a5a2a', '#6a3a4a',
  '#8a4a3a', '#5a5a6a', '#4a7a4a', '#8a5a4a', '#6a4a5a',
];

const EYE_COLORS = [
  '#4a3520', '#3a5040', '#5a4030', '#3a3a50', '#4a4030',
  '#3a4a40', '#5a3a28', '#3a4050', '#4a4a30', '#3a3840',
  '#4a3828', '#3a5038', '#5a3a30', '#3a4048', '#4a4038',
];

const ELDER_HAIR = [
  '#B0A898', '#A8A090', '#B8B0A0', '#C0B8A8', '#9898888',
  '#A0A090', '#B8A8A0', '#A8A898', '#B0B0A0', '#C0B0A8',
  '#A09888', '#B0A8A0', '#A8A090', '#B8B0A8', '#A09890',
];

/** Simple deterministic hash from a name string → 0..n */
function nameHash(name, n) {
  let h = 0;
  const s = name || 'default';
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % n;
}

/** Build a unique color set seeded by the character's name */
function getTraits(member) {
  const name = member.name || 'Pioneer';
  const isFemale = member.gender === 'female';
  const ageGroup = getAgeGroup(member.age);

  if (member.isChaplain) {
    return {
      hair: '#3a3030', skin: SKIN_TONES[nameHash(name, SKIN_TONES.length)],
      cheek: '#d89080', hat: '#1a1a1a', eye: '#3a3a40',
      shirt: '#1a1a1a',
    };
  }

  const skinIdx = nameHash(name, SKIN_TONES.length);
  const hairIdx = nameHash(name + '_hair', isFemale ? HAIR_FEMALE.length : HAIR_MALE.length);
  const eyeIdx = nameHash(name + '_eye', EYE_COLORS.length);
  const skin = SKIN_TONES[skinIdx];
  const hair = ageGroup === 'elder'
    ? ELDER_HAIR[nameHash(name + '_elder', ELDER_HAIR.length)]
    : isFemale ? HAIR_FEMALE[hairIdx] : HAIR_MALE[hairIdx];
  const eye = EYE_COLORS[eyeIdx];

  // Cheek color derived from skin tone (warmer tint)
  const cheek = isFemale ? '#e8a0a0' : '#e0a090';

  if (isFemale) {
    const bonnetIdx = nameHash(name + '_bonnet', BONNET_COLORS.length);
    const bonnetSet = BONNET_COLORS[bonnetIdx];
    const shirtIdx = nameHash(name + '_shirt', ageGroup === 'child' ? CHILD_SHIRT_FEMALE.length : SHIRT_FEMALE.length);
    const shirt = ageGroup === 'child' ? CHILD_SHIRT_FEMALE[shirtIdx] : SHIRT_FEMALE[shirtIdx];
    const ribbonIdx = nameHash(name + '_ribbon', RIBBON_COLORS.length);
    return {
      hair, skin, cheek, eye, shirt,
      bonnet: bonnetSet.bonnet, bonnetTie: bonnetSet.tie,
      ribbon: RIBBON_COLORS[ribbonIdx],
    };
  } else {
    const hatIdx = nameHash(name + '_hat', HAT_MALE.length);
    const shirtIdx = nameHash(name + '_shirt', ageGroup === 'child' ? CHILD_SHIRT_MALE.length : SHIRT_MALE.length);
    return {
      hair, skin, cheek, eye,
      hat: HAT_MALE[hatIdx],
      shirt: ageGroup === 'child' ? CHILD_SHIRT_MALE[shirtIdx] : SHIRT_MALE[shirtIdx],
    };
  }
}

const STATUS_COLORS = {
  good:     '#4A5D23',
  fair:     '#81552c',
  poor:     '#81552c',
  critical: '#9e422c',
  dead:     '#888888',
};

function getMouthPath(mood) {
  switch (mood) {
    case 'happy':   return 'M 18 31 Q 24 36 30 31';
    case 'neutral': return 'M 19 32 L 29 32';
    case 'worried': return 'M 18 34 Q 24 31 30 34';
    case 'grim':    return 'M 18 34 Q 24 30.5 30 34';
    default:        return 'M 19 32 L 29 32';
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
  const isFemale = member.gender === 'female';

  if (ageGroup === 'child') return isFemale ? 'child_f' : 'child_m';
  if (ageGroup === 'teen') return isFemale ? 'teen_f' : 'teen_m';
  if (ageGroup === 'elder') return isFemale ? 'elder_f' : 'elder_m';

  // Adult
  if (member.isPlayer) {
    return isFemale ? 'mother' : 'father';
  }
  return isFemale ? 'daughter' : 'son';
}

/** Health-based opacity for muting colors */
function getHealthOpacity(health) {
  switch (health) {
    case 'good': return 1.0;
    case 'fair': return 0.88;
    case 'poor': return 0.72;
    case 'critical': return 0.58;
    default: return 1.0;
  }
}

/* ------------------------------------------------------------------ */
/*  Sub-components for hats, bonnets, hair, and facial features       */
/* ------------------------------------------------------------------ */

function FrontierHat({ color, wide }) {
  // Wide-brimmed felt hat for adult/elder males
  const brimWidth = wide ? 22 : 18;
  return (
    <g>
      {/* Hat crown */}
      <path
        d={`M ${24 - 9} 12 Q ${24 - 9} 3, 24 3 Q ${24 + 9} 3, ${24 + 9} 12 Z`}
        fill={color}
      />
      {/* Hat brim */}
      <ellipse cx="24" cy="12" rx={brimWidth} ry="4" fill={color} />
      {/* Hat band */}
      <rect x={24 - 9} y="10" width="18" height="2.5" rx="0.5" fill="#2a1a0a" opacity="0.5" />
    </g>
  );
}

function NewsboysCap({ color }) {
  return (
    <g>
      {/* Cap body */}
      <path d="M 12 14 Q 12 6, 24 5 Q 36 6, 36 14 L 34 14 Q 34 8, 24 7 Q 14 8, 14 14 Z" fill={color} />
      {/* Flat brim */}
      <path d="M 10 14 Q 14 12, 24 11.5 Q 30 12, 32 14 L 34 15 Q 28 14, 24 13.5 Q 18 14, 10 16 Z" fill={color} />
      {/* Button on top */}
      <circle cx="24" cy="6" r="1" fill={color} stroke="#2a1a0a" strokeWidth="0.4" />
    </g>
  );
}

function Biretta() {
  // Priest's black biretta
  return (
    <g>
      {/* Cap body */}
      <path d="M 13 13 Q 13 4, 24 3 Q 35 4, 35 13 Z" fill="#1a1a1a" />
      {/* Top ridge fins */}
      <path d="M 18 5 L 18 3 Q 24 1, 30 3 L 30 5" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.4" />
      {/* Pom on top */}
      <circle cx="24" cy="2.5" r="1.5" fill="#1a1a1a" />
      {/* Brim line */}
      <line x1="12" y1="13" x2="36" y2="13" stroke="#2a2a2a" strokeWidth="0.6" />
    </g>
  );
}

function Sunbonnet({ bonnetColor, tieColor, small }) {
  // Prairie sunbonnet with wide brim and chin ties
  const scale = small ? 0.92 : 1;
  return (
    <g transform={small ? 'translate(1,1) scale(0.92)' : undefined}>
      {/* Bonnet back/crown */}
      <path
        d="M 10 16 Q 8 6, 24 4 Q 40 6, 38 16"
        fill={bonnetColor}
      />
      {/* Wide brim (front) */}
      <path
        d="M 8 16 Q 6 12, 14 9 Q 20 7, 24 6.5 Q 28 7, 34 9 Q 42 12, 40 16"
        fill={bonnetColor}
        stroke="#c0a870"
        strokeWidth="0.4"
      />
      {/* Brim underside shadow */}
      <path
        d="M 10 15 Q 24 13, 38 15"
        fill="none"
        stroke="#b09860"
        strokeWidth="0.6"
        opacity="0.5"
      />
      {/* Ruffle lines on brim */}
      <path d="M 14 10 Q 19 8.5, 24 8" fill="none" stroke="#d0c0a0" strokeWidth="0.3" opacity="0.6" />
      <path d="M 34 10 Q 29 8.5, 24 8" fill="none" stroke="#d0c0a0" strokeWidth="0.3" opacity="0.6" />
      {/* Chin ties */}
      <path d="M 11 16 Q 10 24, 12 32 Q 13 35, 14 36" fill="none" stroke={tieColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 37 16 Q 38 24, 36 32 Q 35 35, 34 36" fill="none" stroke={tieColor} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

function HairRibbon({ color }) {
  return (
    <g>
      <path d="M 20 9 Q 22 7, 24 8 Q 26 7, 28 9" fill={color} />
      <path d="M 22 8 L 20 6 Q 19 5, 20 4" fill={color} stroke={color} strokeWidth="0.5" />
      <path d="M 26 8 L 28 6 Q 29 5, 28 4" fill={color} stroke={color} strokeWidth="0.5" />
    </g>
  );
}

function RomanCollar() {
  return (
    <g>
      {/* Black cassock at shoulders */}
      <path d="M 11 38 Q 14 34, 24 33 Q 34 34, 37 38 L 37 44 L 11 44 Z" fill="#1a1a1a" />
      {/* White Roman collar band */}
      <rect x="19" y="34" width="10" height="2.5" rx="1" fill="#f0f0f0" />
      {/* Gold cross pendant */}
      <line x1="24" y1="37" x2="24" y2="41" stroke="#c9a030" strokeWidth="1" />
      <line x1="22" y1="38.5" x2="26" y2="38.5" stroke="#c9a030" strokeWidth="1" />
    </g>
  );
}

function ShirtCollar({ color }) {
  return (
    <path
      d={`M 14 38 Q 18 34, 24 33 Q 30 34, 34 38 L 36 44 L 12 44 Z`}
      fill={color}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CharacterFace({ member, size = 48 }) {
  const role = getRole(member);
  const ageGroup = getAgeGroup(member.age);
  const colors = getTraits(member);
  const mood = getMood(member.health, member.morale ?? 70);
  const statusColor = STATUS_COLORS[member.health] || STATUS_COLORS.good;
  const isDead = member.health === 'dead' || !member.alive;
  const healthOpacity = getHealthOpacity(member.health);
  const isFemale = member.gender === 'female';
  const isChaplain = member.isChaplain;

  // Determine face shape per age
  const faceRx = ageGroup === 'child' ? 11 : ageGroup === 'teen' ? 12 : 13;
  const faceRy = ageGroup === 'child' ? 12 : ageGroup === 'teen' ? 13 : 14;
  const faceCy = ageGroup === 'child' ? 24 : 23;

  // Eye sizing per age
  const eyeRx = ageGroup === 'child' ? 2.8 : ageGroup === 'elder' ? 2.2 : ageGroup === 'teen' ? 2.6 : 2.4;
  const eyeRy = ageGroup === 'child' ? 3.0 : ageGroup === 'elder' ? 2.0 : ageGroup === 'teen' ? 2.8 : 2.6;
  const eyeY = ageGroup === 'child' ? 23 : 22;
  const highlightR = ageGroup === 'child' ? 1.2 : ageGroup === 'elder' ? 0.7 : 1.0;

  // Cheek sizing
  const cheekRx = ageGroup === 'child' ? 4 : 3.2;
  const cheekRy = ageGroup === 'child' ? 3 : 2.2;
  const cheekOpacity = ageGroup === 'child' ? 0.55 : ageGroup === 'teen' ? 0.45 : 0.35;
  const cheekY = ageGroup === 'child' ? 28 : 27;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{
        flexShrink: 0,
        opacity: isDead ? 0.45 : healthOpacity,
        filter: isDead ? 'grayscale(0.8)' : 'none',
      }}
    >
      {/* ---- Layer 1: Hat/Bonnet background & Hair ---- */}

      {/* Hair base (behind face, visible around edges) */}
      {isChaplain ? (
        /* Tonsured short hair */
        <ellipse cx="24" cy="18" rx="14" ry="13" fill={colors.hair} />
      ) : isFemale && (ageGroup === 'adult' || ageGroup === 'elder') ? (
        /* Hair peeking from bonnet */
        <>
          <ellipse cx="24" cy="20" rx="14" ry="14" fill={colors.hair} />
          {/* Hair strands visible at sides */}
          <path d="M 12 20 Q 10 28, 13 34" fill="none" stroke={colors.hair} strokeWidth="2.5" />
          <path d="M 36 20 Q 38 28, 35 34" fill="none" stroke={colors.hair} strokeWidth="2.5" />
        </>
      ) : isFemale && ageGroup === 'teen' ? (
        /* Braids */
        <>
          <ellipse cx="24" cy="18" rx="14" ry="14" fill={colors.hair} />
          <path d="M 12 18 Q 10 28, 11 36 Q 11 38, 13 38" fill="none" stroke={colors.hair} strokeWidth="3" />
          <path d="M 36 18 Q 38 28, 37 36 Q 37 38, 35 38" fill="none" stroke={colors.hair} strokeWidth="3" />
          {/* Braid texture */}
          <path d="M 11 24 L 12 26 L 10 28 L 12 30 L 10 32 L 12 34" fill="none" stroke="#00000015" strokeWidth="0.8" />
          <path d="M 37 24 L 36 26 L 38 28 L 36 30 L 38 32 L 36 34" fill="none" stroke="#00000015" strokeWidth="0.8" />
        </>
      ) : role === 'child_f' ? (
        /* Pigtails */
        <>
          <ellipse cx="24" cy="18" rx="13" ry="13" fill={colors.hair} />
          {/* Messy top hair */}
          <path d="M 14 12 Q 16 8, 20 10 Q 22 6, 26 10 Q 28 7, 32 10 Q 34 8, 34 12" fill={colors.hair} />
          {/* Pigtails */}
          <path d="M 12 16 Q 8 20, 8 28 Q 8 32, 10 34" fill="none" stroke={colors.hair} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 36 16 Q 40 20, 40 28 Q 40 32, 38 34" fill="none" stroke={colors.hair} strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : role === 'child_m' ? (
        /* Tousled messy hair */
        <>
          <ellipse cx="24" cy="17" rx="14" ry="13" fill={colors.hair} />
          <path d="M 12 12 Q 14 6, 18 9 Q 20 4, 24 8 Q 26 3, 30 8 Q 33 5, 35 10 Q 38 7, 36 13" fill={colors.hair} />
        </>
      ) : (
        /* Default hair */
        <ellipse cx="24" cy="18" rx="15" ry="14" fill={colors.hair} />
      )}

      {/* ---- Layer 2: Face ---- */}
      <ellipse cx="24" cy={faceCy} rx={faceRx} ry={faceRy} fill={colors.skin} />

      {/* Neck hint */}
      <rect x="20" y={faceCy + faceRy - 3} width="8" height="6" rx="2" fill={colors.skin} />

      {/* ---- Layer 3: Shirt/Collar/Cassock ---- */}
      {isChaplain ? (
        <RomanCollar />
      ) : (
        <ShirtCollar color={colors.shirt} />
      )}

      {/* ---- Layer 4: Cheeks ---- */}
      <ellipse cx="16" cy={cheekY} rx={cheekRx} ry={cheekRy} fill={colors.cheek} opacity={cheekOpacity} />
      <ellipse cx="32" cy={cheekY} rx={cheekRx} ry={cheekRy} fill={colors.cheek} opacity={cheekOpacity} />

      {/* ---- Layer 5: Eyes ---- */}
      {/* Eyebrows */}
      {ageGroup !== 'child' && (
        <>
          <path
            d={`M ${19 - eyeRx} ${eyeY - eyeRy - 1} Q 19 ${eyeY - eyeRy - 2.5}, ${19 + eyeRx} ${eyeY - eyeRy - 1}`}
            fill="none" stroke={colors.hair} strokeWidth={ageGroup === 'elder' ? 0.8 : 1} opacity="0.6"
          />
          <path
            d={`M ${29 - eyeRx} ${eyeY - eyeRy - 1} Q 29 ${eyeY - eyeRy - 2.5}, ${29 + eyeRx} ${eyeY - eyeRy - 1}`}
            fill="none" stroke={colors.hair} strokeWidth={ageGroup === 'elder' ? 0.8 : 1} opacity="0.6"
          />
        </>
      )}

      {/* Eye whites */}
      <ellipse cx="19" cy={eyeY} rx={eyeRx} ry={eyeRy} fill="white" />
      <ellipse cx="29" cy={eyeY} rx={eyeRx} ry={eyeRy} fill="white" />

      {/* Iris + pupil */}
      <ellipse cx="19" cy={eyeY} rx={eyeRx * 0.65} ry={eyeRy * 0.7} fill={colors.eye || '#4a3520'} />
      <ellipse cx="29" cy={eyeY} rx={eyeRx * 0.65} ry={eyeRy * 0.7} fill={colors.eye || '#4a3520'} />
      <circle cx="19" cy={eyeY} r={eyeRx * 0.35} fill="#1a1008" />
      <circle cx="29" cy={eyeY} r={eyeRx * 0.35} fill="#1a1008" />

      {/* Highlights */}
      <circle cx={19 + 0.8} cy={eyeY - 0.8} r={highlightR} fill="white" />
      <circle cx={29 + 0.8} cy={eyeY - 0.8} r={highlightR} fill="white" />

      {/* Elder: crow's feet + wrinkle lines */}
      {ageGroup === 'elder' && (
        <>
          <path d="M 11 20 L 14 21.5" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M 11 22 L 14 22" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M 11 24 L 14 22.5" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M 37 20 L 34 21.5" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M 37 22 L 34 22" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          <path d="M 37 24 L 34 22.5" stroke="#8a7060" strokeWidth="0.6" opacity="0.5" />
          {/* Forehead lines */}
          <line x1="18" y1="14" x2="30" y2="14" stroke="#8a7060" strokeWidth="0.4" opacity="0.3" />
          <line x1="17" y1="16" x2="31" y2="16" stroke="#8a7060" strokeWidth="0.4" opacity="0.25" />
        </>
      )}

      {/* Poor/critical: tired eyes (lines under eyes) */}
      {(member.health === 'poor' || member.health === 'critical') && (
        <>
          <path d={`M ${19 - eyeRx} ${eyeY + eyeRy + 0.5} Q 19 ${eyeY + eyeRy + 2}, ${19 + eyeRx} ${eyeY + eyeRy + 0.5}`}
            fill="none" stroke="#8a7060" strokeWidth="0.5" opacity="0.5" />
          <path d={`M ${29 - eyeRx} ${eyeY + eyeRy + 0.5} Q 29 ${eyeY + eyeRy + 2}, ${29 + eyeRx} ${eyeY + eyeRy + 0.5}`}
            fill="none" stroke="#8a7060" strokeWidth="0.5" opacity="0.5" />
        </>
      )}

      {/* ---- Layer 6: Nose ---- */}
      <path
        d={ageGroup === 'child'
          ? 'M 23 25 Q 24 27, 25 25'
          : 'M 23 24 Q 24 28, 25 24'}
        fill="none" stroke="#a08060" strokeWidth="0.8" opacity="0.5"
      />

      {/* ---- Layer 7: Mouth ---- */}
      <path d={getMouthPath(mood)} fill="none" stroke="#5a3020" strokeWidth="1.5" strokeLinecap="round" />

      {/* ---- Layer 8: Facial hair (adult/elder males) ---- */}
      {!isFemale && !isChaplain && (ageGroup === 'adult' || ageGroup === 'elder') && (
        <>
          {/* Stubble/beard shadow along jaw */}
          <path
            d="M 14 30 Q 14 38, 24 40 Q 34 38, 34 30"
            fill="none"
            stroke={ageGroup === 'elder' ? '#B0A898' : colors.hair}
            strokeWidth="1.5"
            opacity="0.35"
          />
          {/* Chin beard fill */}
          <path
            d="M 18 34 Q 18 39, 24 40 Q 30 39, 30 34"
            fill={ageGroup === 'elder' ? '#B0A898' : colors.hair}
            opacity="0.25"
          />
        </>
      )}

      {/* Chaplain: clean-shaven, no facial hair */}

      {/* ---- Layer 9: Child freckles ---- */}
      {ageGroup === 'child' && (
        <>
          <circle cx="16" cy="27" r="0.6" fill="#c09070" opacity="0.45" />
          <circle cx="18" cy="26" r="0.5" fill="#c09070" opacity="0.45" />
          <circle cx="30" cy="26" r="0.5" fill="#c09070" opacity="0.45" />
          <circle cx="32" cy="27" r="0.6" fill="#c09070" opacity="0.45" />
          <circle cx="17" cy="29" r="0.5" fill="#c09070" opacity="0.35" />
          <circle cx="31" cy="29" r="0.5" fill="#c09070" opacity="0.35" />
        </>
      )}

      {/* ---- Layer 10: Hats, bonnets, headwear (foreground) ---- */}
      {isChaplain && <Biretta />}

      {!isChaplain && !isFemale && ageGroup === 'adult' && (
        <FrontierHat color={colors.hat} wide />
      )}

      {!isChaplain && !isFemale && ageGroup === 'elder' && (
        <FrontierHat color={colors.hat} wide />
      )}

      {!isChaplain && !isFemale && ageGroup === 'teen' && (
        <NewsboysCap color={colors.hat || '#5a4030'} />
      )}

      {!isChaplain && isFemale && ageGroup === 'adult' && (
        <Sunbonnet bonnetColor={colors.bonnet} tieColor={colors.bonnetTie} />
      )}

      {!isChaplain && isFemale && ageGroup === 'elder' && (
        <Sunbonnet bonnetColor={colors.bonnet} tieColor={colors.bonnetTie} />
      )}

      {!isChaplain && isFemale && ageGroup === 'teen' && (
        <Sunbonnet bonnetColor={colors.bonnet} tieColor={colors.bonnetTie} small />
      )}

      {/* Child girl: hair ribbon */}
      {role === 'child_f' && colors.ribbon && (
        <HairRibbon color={colors.ribbon} />
      )}

      {/* ---- Layer 11: Status indicator dot (top-right) ---- */}
      <circle cx="40" cy="8" r="4.5" fill={statusColor} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
