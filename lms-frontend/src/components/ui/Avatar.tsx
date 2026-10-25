import React from 'react';

interface AvatarProps {
  name: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  style?: React.CSSProperties;
}

// Fonction déterministe pour récupérer les initiales
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';

  const commonSgLastnames = new Set([
    'diop', 'ndiaye', 'sall', 'faye', 'gueye', 'diallo', 'ba', 'kane', 'sy', 
    'cisse', 'diagne', 'sow', 'fall', 'toure', 'keita', 'diouf', 'seck', 
    'thiam', 'mbacke', 'niang', 'balde', 'beye', 'ciss', 'coly', 'dabo', 
    'dia', 'diaw', 'dione', 'drame', 'gassama', 'mane', 'mbaye', 'ndaw', 
    'ndong', 'ndour', 'sene', 'sidibe', 'tall', 'wade', 'wane'
  ]);

  if (parts.length >= 2) {
    let lastname: string | null = null;
    let firstname: string | null = null;

    // 1. Détection par nom de famille entièrement en MAJUSCULES (ex: DIOP Medoune ou Medoune DIOP)
    for (const p of parts) {
      const isAllCaps = p.length > 1 && p === p.toUpperCase() && /^[A-ZÀ-Ÿ]+$/.test(p);
      if (isAllCaps) {
        lastname = p;
      } else if (!firstname) {
        firstname = p;
      }
    }

    // 2. Détection par liste de noms de famille sénégalais courants si écrit sous forme "Nom Prénom"
    if (!lastname || !firstname) {
      const firstLower = parts[0].toLowerCase();
      if (commonSgLastnames.has(firstLower)) {
        lastname = parts[0];
        firstname = parts[parts.length - 1];
      }
    }

    if (lastname && firstname) {
      return `${firstname[0]}${lastname[0]}`.toUpperCase();
    }

    // Si tous les mots sont en majuscules (ex: DIOP MEDOUNE), l'usage académique écrit NOM Prénom.
    const isAllAllUpper = parts.every((p) => p === p.toUpperCase());
    if (isAllAllUpper) {
      const firstCharNom = parts[0][0];
      const firstCharPrenom = parts[parts.length - 1][0];
      return `${firstCharPrenom}${firstCharNom}`.toUpperCase();
    }

    // Format standard Prénom Nom (ex: Medoune Diop)
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first[0]}${last[0]}`.toUpperCase();
  }

  const single = parts[0];
  const singleLower = single.toLowerCase();

  const commonSgFirstnames = new Set([
    'medoune', 'moustapha', 'aziz', 'abdoul', 'fatou', 'bamba', 'khady', 
    'ousmane', 'cheikh', 'ibrahima', 'mariama', 'aminata', 'moussa', 
    'aliou', 'amadou', 'djibril', 'daba', 'mbacke', 'yacine', 'ngone',
    'aida', 'ramatoulaye', 'sokhna', 'serigne', 'fallou', 'modou', 'baye',
    'seyni', 'demba', 'birame', 'mor', 'ibra', 'alassane', 'ousseynou', 'assane'
  ]);

  // 1. Détecter si l'identifiant unique est [nom][prénom] (ex: diopmedoune)
  for (const ln of Array.from(commonSgLastnames)) {
    if (singleLower.startsWith(ln) && singleLower.length > ln.length) {
      const firstCharNom = ln[0].toUpperCase();
      const firstCharPrenom = singleLower[ln.length].toUpperCase();
      return `${firstCharPrenom}${firstCharNom}`;
    }
  }

  // 2. Détecter si l'identifiant unique est [initiale nom][prénom] (ex: dmedoune pour Diop Medoune)
  if (singleLower.length > 2) {
    const firstLetter = singleLower[0];
    const remaining = singleLower.substring(1);
    if (commonSgFirstnames.has(remaining)) {
      const firstCharNom = firstLetter.toUpperCase();
      const firstCharPrenom = remaining[0].toUpperCase();
      return `${firstCharPrenom}${firstCharNom}`;
    }
  }

  // 3. Détecter si l'identifiant unique finit par un nom de famille connu (ex: msow pour Moustapha Sow)
  for (const ln of Array.from(commonSgLastnames)) {
    if (singleLower.endsWith(ln) && singleLower.length > ln.length) {
      const firstCharNom = ln[0].toUpperCase();
      const firstCharPrenom = singleLower[0].toUpperCase();
      return `${firstCharPrenom}${firstCharNom}`;
    }
  }

  if (single.length >= 2) {
    return single.substring(0, 2).toUpperCase();
  }
  return single[0].toUpperCase();
};

// Couleurs Google Meet déterministes basées sur le hachage du nom
const getInitialsColor = (name: string): string => {
  const colors = [
    '#1E88E5', // Blue
    '#43A047', // Green
    '#E53935', // Red
    '#FB8C00', // Orange
    '#8E24AA', // Purple
    '#00ACC1', // Cyan
    '#3949AB', // Indigo
    '#00897B', // Teal
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Avatar: React.FC<AvatarProps> = ({ name, firstName, lastName, size = 'md', className = '', style }) => {
  let resolvedFirstName = firstName;
  let resolvedLastName = lastName;

  if (!resolvedFirstName && !resolvedLastName && name) {
    const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      resolvedLastName = parts[parts.length - 1];
      resolvedFirstName = parts.slice(0, parts.length - 1).join(' ');
    }
  }

  const fName = resolvedFirstName?.trim();
  const lName = resolvedLastName?.trim();
  const initials = fName && lName
    ? `${fName[0]}${lName[0]}`.toUpperCase()
    : getInitials(name);
  const backgroundColor = getInitialsColor(name || `${resolvedFirstName} ${resolvedLastName}`);

  // Déterminer la taille numérique (pixels)
  let pixelSize = 40;
  let fontSize = '0.95rem';
  if (typeof size === 'number') {
    pixelSize = size;
    fontSize = `${size * 0.4}px`;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 32;
        fontSize = '0.8rem';
        break;
      case 'lg':
        pixelSize = 72;
        fontSize = '1.75rem';
        break;
      case 'md':
      default:
        pixelSize = 42;
        fontSize = '1rem';
        break;
    }
  }

  const baseStyle: React.CSSProperties = {
    width: `${pixelSize}px`,
    height: `${pixelSize}px`,
    borderRadius: '50%',
    backgroundColor,
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize,
    userSelect: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    letterSpacing: '0.5px',
    flexShrink: 0,
    ...style,
  };

  return (
    <div className={`google-meet-avatar ${className}`} style={baseStyle} title={name}>
      {initials}
    </div>
  );
};

export default Avatar;
