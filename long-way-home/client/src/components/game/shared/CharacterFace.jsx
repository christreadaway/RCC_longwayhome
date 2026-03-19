/**
 * Procedural SVG character portrait — 1840s frontier era.
 * Parameterized by role (skin/hair/hat), mood (mouth shape), health status (dot + saturation),
 * age group (child/teen/adult/elder), and chaplain flag for period clergy.
 * All shapes are SVG primitives — no external images or fonts.
 */

const ROLE_COLORS = {
  father:   { hair: '#4a3520', skin: '#D4A574', cheek: '#e8a090', hat: '#3a2a1a' },
  mother:   { hair: '#6a3a2a', skin: '#DEB090', cheek: '#e8a0a0', bonnet: '#f0e6d0', bonnetTie: '#c0a070' },
  son:      { hair: '#5C4033', skin: '#D4A574', cheek: '#e8a090', hat: '#5a4030' },
  daughter: { hair: '#8a5a3a', skin: '#DEB090', cheek: '#e8a0a0', bonnet: '#f0e6d0', bonnetTie: '#c0a070' },
  teen_m:   { hair: '#5C4033', skin: '#D4A574', cheek: '#e8a090', hat: '#5a4030' },
  teen_f:   { hair: '#7a4a2a', skin: '#DEB090', cheek: '#e8a0a0', bonnet: '#ede0cc', bonnetTie: '#b89860' },
  child_m:  { hair: '#6a4a30', skin: '#D4A574', cheek: '#f0b0a0' },
  child_f:  { hair: '#8a5a3a', skin: '#DEB090', cheek: '#f0b0a0', ribbon: '#9e422c' },
  elder_m:  { hair: '#B0A898', skin: '#C8A070', cheek: '#d89888', hat: '#2a2020' },
  elder_f:  { hair: '#B0A898', skin: '#C8A070', cheek: '#d89888', bonnet: '#e8dcc8', bonnetTie: '#a08860' },
  chaplain: { hair: '#3a3030', skin: '#C8A070', cheek: '#d89080', hat: '#1a1a1a' },
  default:  { hair: '#5a4030', skin: '#D4A574', cheek: '#e8a090', hat: '#3a2a1a' },
};

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
  const colors = ROLE_COLORS[role] || ROLE_COLORS.default;
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
      ) : isFemale ? (
        <ShirtCollar color={ageGroup === 'child' ? '#a8c4a0' : '#7a6a5a'} />
      ) : (
        <ShirtCollar color={ageGroup === 'child' ? '#6a8a9a' : '#5a4a3a'} />
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
      <ellipse cx="19" cy={eyeY} rx={eyeRx * 0.65} ry={eyeRy * 0.7} fill="#4a3520" />
      <ellipse cx="29" cy={eyeY} rx={eyeRx * 0.65} ry={eyeRy * 0.7} fill="#4a3520" />
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
