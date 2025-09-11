/**
 * Baby name generation algorithm
 * Creates creative combinations of parent names
 */

interface NameCombination {
  name: string;
  explanation: string;
}

/**
 * Generate creative baby names by combining parent names
 */
export function generateBabyName(
  name1?: string,
  name2?: string,
): NameCombination {
  // Default names if not provided
  const parent1Name = name1?.trim().toLowerCase() || 'parent';
  const parent2Name = name2?.trim().toLowerCase() || 'partner';

  // If names are too similar or identical, use simple approach
  if (parent1Name === parent2Name) {
    return {
      name: capitalizeFirst(parent1Name),
      explanation: `Named after both parents: ${capitalizeFirst(parent1Name)}`,
    };
  }

  // Try different combination strategies
  const strategies = [
    () => blendStrategy(parent1Name, parent2Name),
    () => portmanteauStrategy(parent1Name, parent2Name),
    () => syllableBlendStrategy(parent1Name, parent2Name),
    () => prefixSuffixStrategy(parent1Name, parent2Name),
  ];

  // Try each strategy and pick the first valid result
  for (const strategy of strategies) {
    const result = strategy();
    if (result && result.name.length >= 3 && result.name.length <= 12) {
      return result;
    }
  }

  // Fallback to simple concatenation
  return {
    name: capitalizeFirst(parent1Name.slice(0, 2) + parent2Name.slice(0, 3)),
    explanation: `A creative blend of ${capitalizeFirst(parent1Name)} and ${capitalizeFirst(parent2Name)}`,
  };
}

/**
 * Blend names by taking parts from each
 * Examples: Kevin + Kelly = Kelvin, John + Mary = Johary
 */
function blendStrategy(name1: string, name2: string): NameCombination {
  const len1 = name1.length;
  const len2 = name2.length;
  
  // Take first part of name1 and ending of name2
  const firstPart = name1.slice(0, Math.ceil(len1 / 2));
  const secondPart = name2.slice(Math.floor(len2 / 2));
  
  const blendedName = firstPart + secondPart;
  
  return {
    name: capitalizeFirst(blendedName),
    explanation: `Blending ${capitalizeFirst(name1)} and ${capitalizeFirst(name2)}`,
  };
}

/**
 * Create portmanteau-style combinations
 * Examples: Sarah + Michael = Sarahel, David + Emma = Davemma
 */
function portmanteauStrategy(name1: string, name2: string): NameCombination {
  const overlap = findOverlap(name1, name2);
  
  if (overlap.length >= 2) {
    // Names have overlap, create portmanteau
    const beforeOverlap = name1.slice(0, name1.indexOf(overlap));
    const afterOverlap = name2.slice(name2.indexOf(overlap) + overlap.length);
    const portmanteau = beforeOverlap + overlap + afterOverlap;
    
    return {
      name: capitalizeFirst(portmanteau),
      explanation: `A portmanteau of ${capitalizeFirst(name1)} and ${capitalizeFirst(name2)}`,
    };
  }
  
  // No overlap, create simple portmanteau
  const splitPoint1 = Math.floor(name1.length * 0.6);
  const splitPoint2 = Math.floor(name2.length * 0.4);
  
  const portmanteau = name1.slice(0, splitPoint1) + name2.slice(splitPoint2);
  
  return {
    name: capitalizeFirst(portmanteau),
    explanation: `A creative fusion of ${capitalizeFirst(name1)} and ${capitalizeFirst(name2)}`,
  };
}

/**
 * Blend names by syllables
 */
function syllableBlendStrategy(name1: string, name2: string): NameCombination {
  const syllables1 = getSyllables(name1);
  const syllables2 = getSyllables(name2);
  
  // Take first syllable(s) from name1 and last from name2
  const firstSyllables = syllables1.slice(0, Math.ceil(syllables1.length / 2));
  const lastSyllables = syllables2.slice(Math.floor(syllables2.length / 2));
  
  const blendedName = [...firstSyllables, ...lastSyllables].join('');
  
  return {
    name: capitalizeFirst(blendedName),
    explanation: `Combining syllables from ${capitalizeFirst(name1)} and ${capitalizeFirst(name2)}`,
  };
}

/**
 * Use prefix from one name and suffix from another
 */
function prefixSuffixStrategy(name1: string, name2: string): NameCombination {
  // Try different combinations
  const combinations = [
    name1.slice(0, 2) + name2.slice(-3),
    name1.slice(0, 3) + name2.slice(-2),
    name2.slice(0, 2) + name1.slice(-3),
    name2.slice(0, 3) + name1.slice(-2),
  ];
  
  // Pick the most balanced combination
  const bestCombination = combinations
    .filter(combo => combo.length >= 4 && combo.length <= 8)
    .sort((a, b) => Math.abs(a.length - 6) - Math.abs(b.length - 6))[0];
  
  return {
    name: capitalizeFirst(bestCombination || combinations[0]),
    explanation: `Combining elements from ${capitalizeFirst(name1)} and ${capitalizeFirst(name2)}`,
  };
}

/**
 * Find overlapping characters between two names
 */
function findOverlap(str1: string, str2: string): string {
  let maxOverlap = '';
  
  for (let i = 0; i < str1.length; i++) {
    for (let j = 0; j < str2.length; j++) {
      let overlap = '';
      let k = 0;
      
      while (
        i + k < str1.length &&
        j + k < str2.length &&
        str1[i + k] === str2[j + k]
      ) {
        overlap += str1[i + k];
        k++;
      }
      
      if (overlap.length > maxOverlap.length) {
        maxOverlap = overlap;
      }
    }
  }
  
  return maxOverlap;
}

/**
 * Simple syllable detection (basic vowel-based approach)
 */
function getSyllables(word: string): string[] {
  const vowels = 'aeiouy';
  const syllables: string[] = [];
  let currentSyllable = '';
  let lastWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    const isVowel = vowels.includes(char);
    
    currentSyllable += word[i];
    
    if (isVowel && !lastWasVowel) {
      // Start of a new vowel group
      if (i > 0) {
        syllables.push(currentSyllable.slice(0, -1));
        currentSyllable = word[i];
      }
    }
    
    lastWasVowel = isVowel;
  }
  
  if (currentSyllable) {
    syllables.push(currentSyllable);
  }
  
  return syllables.length > 0 ? syllables : [word];
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate multiple name options
 */
export function generateMultipleBabyNames(
  name1?: string,
  name2?: string,
  count: number = 3,
): NameCombination[] {
  if (!name1 || !name2) {
    return [generateBabyName(name1, name2)];
  }

  const names: NameCombination[] = [];
  
  // Generate primary name
  names.push(generateBabyName(name1, name2));
  
  // Generate alternative combinations if we need more
  if (count > 1) {
    names.push(generateBabyName(name2, name1)); // Reverse order
  }
  
  // Generate more creative variations
  if (count > 2) {
    const creative = {
      name: capitalizeFirst(name1.slice(0, 1) + name2.slice(1, 3) + name1.slice(-2)),
      explanation: `A unique blend inspired by ${capitalizeFirst(name1)} and ${capitalizeFirst(name2)}`,
    };
    names.push(creative);
  }
  
  // Ensure unique names
  const uniqueNames = names.filter(
    (name, index, self) => 
      index === self.findIndex(n => n.name.toLowerCase() === name.name.toLowerCase())
  );
  
  return uniqueNames.slice(0, count);
}