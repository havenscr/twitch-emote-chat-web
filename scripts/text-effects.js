/* ================================================================
   TEXT EFFECTS MODULE
   Unicode-based text transformations for fun chat effects
   ================================================================ */

const TextEffects = (function() {

  // Upside down character map (flipped and reversed)
  const UPSIDE_DOWN_MAP = {
    'a': '\u0250', 'b': 'q', 'c': '\u0254', 'd': 'p', 'e': '\u01DD',
    'f': '\u025F', 'g': '\u0183', 'h': '\u0265', 'i': '\u0131', 'j': '\u027E',
    'k': '\u029E', 'l': 'l', 'm': '\u026F', 'n': 'u', 'o': 'o',
    'p': 'd', 'q': 'b', 'r': '\u0279', 's': 's', 't': '\u0287',
    'u': 'n', 'v': '\u028C', 'w': '\u028D', 'x': 'x', 'y': '\u028E',
    'z': 'z',
    'A': '\u2200', 'B': 'q', 'C': '\u0186', 'D': 'p', 'E': '\u018E',
    'F': '\u2132', 'G': '\u2141', 'H': 'H', 'I': 'I', 'J': '\u017F',
    'K': '\u029E', 'L': '\u02E5', 'M': 'W', 'N': 'N', 'O': 'O',
    'P': '\u0500', 'Q': '\u038C', 'R': '\u1D1A', 'S': 'S', 'T': '\u22A5',
    'U': '\u2229', 'V': '\u039B', 'W': 'M', 'X': 'X', 'Y': '\u2144',
    'Z': 'Z',
    '1': '\u0196', '2': '\u1105', '3': '\u0190', '4': '\u3123',
    '5': '\u03DB', '6': '9', '7': '\u3125', '8': '8', '9': '6', '0': '0',
    '.': '\u02D9', ',': "'", "'": ',', '"': ',,', '`': ',',
    '?': '\u00BF', '!': '\u00A1', '[': ']', ']': '[', '(': ')', ')': '(',
    '{': '}', '}': '{', '<': '>', '>': '<', '&': '\u214B',
    '_': '\u203E', ';': '\u061B', ' ': ' '
  };

  // Small caps character map
  const SMALL_CAPS_MAP = {
    'a': '\u1D00', 'b': '\u0299', 'c': '\u1D04', 'd': '\u1D05', 'e': '\u1D07',
    'f': '\u0493', 'g': '\u0262', 'h': '\u029C', 'i': '\u026A', 'j': '\u1D0A',
    'k': '\u1D0B', 'l': '\u029F', 'm': '\u1D0D', 'n': '\u0274', 'o': '\u1D0F',
    'p': '\u1D18', 'q': 'q', 'r': '\u0280', 's': '\u0455', 't': '\u1D1B',
    'u': '\u1D1C', 'v': '\u1D20', 'w': '\u1D21', 'x': 'x', 'y': '\u028F',
    'z': '\u1D22'
  };

  // Superscript character map
  const SUPERSCRIPT_MAP = {
    'a': '\u1D43', 'b': '\u1D47', 'c': '\u1D9C', 'd': '\u1D48', 'e': '\u1D49',
    'f': '\u1DA0', 'g': '\u1D4D', 'h': '\u02B0', 'i': '\u2071', 'j': '\u02B2',
    'k': '\u1D4F', 'l': '\u02E1', 'm': '\u1D50', 'n': '\u207F', 'o': '\u1D52',
    'p': '\u1D56', 'q': 'q', 'r': '\u02B3', 's': '\u02E2', 't': '\u1D57',
    'u': '\u1D58', 'v': '\u1D5B', 'w': '\u02B7', 'x': '\u02E3', 'y': '\u02B8',
    'z': '\u1DBB',
    'A': '\u1D2C', 'B': '\u1D2E', 'C': 'C', 'D': '\u1D30', 'E': '\u1D31',
    'F': 'F', 'G': '\u1D33', 'H': '\u1D34', 'I': '\u1D35', 'J': '\u1D36',
    'K': '\u1D37', 'L': '\u1D38', 'M': '\u1D39', 'N': '\u1D3A', 'O': '\u1D3C',
    'P': '\u1D3E', 'Q': 'Q', 'R': '\u1D3F', 'S': 'S', 'T': '\u1D40',
    'U': '\u1D41', 'V': '\u2C7D', 'W': '\u1D42', 'X': 'X', 'Y': 'Y',
    'Z': 'Z',
    '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074',
    '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
    '+': '\u207A', '-': '\u207B', '=': '\u207C', '(': '\u207D', ')': '\u207E'
  };

  // Subscript character map
  const SUBSCRIPT_MAP = {
    'a': '\u2090', 'e': '\u2091', 'h': '\u2095', 'i': '\u1D62', 'j': '\u2C7C',
    'k': '\u2096', 'l': '\u2097', 'm': '\u2098', 'n': '\u2099', 'o': '\u2092',
    'p': '\u209A', 'r': '\u1D63', 's': '\u209B', 't': '\u209C', 'u': '\u1D64',
    'v': '\u1D65', 'x': '\u2093',
    '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
    '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089',
    '+': '\u208A', '-': '\u208B', '=': '\u208C', '(': '\u208D', ')': '\u208E'
  };

  // Bubble (circled) character map
  const BUBBLE_MAP = {
    'a': '\u24D0', 'b': '\u24D1', 'c': '\u24D2', 'd': '\u24D3', 'e': '\u24D4',
    'f': '\u24D5', 'g': '\u24D6', 'h': '\u24D7', 'i': '\u24D8', 'j': '\u24D9',
    'k': '\u24DA', 'l': '\u24DB', 'm': '\u24DC', 'n': '\u24DD', 'o': '\u24DE',
    'p': '\u24DF', 'q': '\u24E0', 'r': '\u24E1', 's': '\u24E2', 't': '\u24E3',
    'u': '\u24E4', 'v': '\u24E5', 'w': '\u24E6', 'x': '\u24E7', 'y': '\u24E8',
    'z': '\u24E9',
    'A': '\u24B6', 'B': '\u24B7', 'C': '\u24B8', 'D': '\u24B9', 'E': '\u24BA',
    'F': '\u24BB', 'G': '\u24BC', 'H': '\u24BD', 'I': '\u24BE', 'J': '\u24BF',
    'K': '\u24C0', 'L': '\u24C1', 'M': '\u24C2', 'N': '\u24C3', 'O': '\u24C4',
    'P': '\u24C5', 'Q': '\u24C6', 'R': '\u24C7', 'S': '\u24C8', 'T': '\u24C9',
    'U': '\u24CA', 'V': '\u24CB', 'W': '\u24CC', 'X': '\u24CD', 'Y': '\u24CE',
    'Z': '\u24CF',
    '0': '\u24EA', '1': '\u2460', '2': '\u2461', '3': '\u2462', '4': '\u2463',
    '5': '\u2464', '6': '\u2465', '7': '\u2466', '8': '\u2467', '9': '\u2468'
  };

  // Square character map
  const SQUARE_MAP = {
    'A': '\u1F130', 'B': '\u1F131', 'C': '\u1F132', 'D': '\u1F133', 'E': '\u1F134',
    'F': '\u1F135', 'G': '\u1F136', 'H': '\u1F137', 'I': '\u1F138', 'J': '\u1F139',
    'K': '\u1F13A', 'L': '\u1F13B', 'M': '\u1F13C', 'N': '\u1F13D', 'O': '\u1F13E',
    'P': '\u1F13F', 'Q': '\u1F140', 'R': '\u1F141', 'S': '\u1F142', 'T': '\u1F143',
    'U': '\u1F144', 'V': '\u1F145', 'W': '\u1F146', 'X': '\u1F147', 'Y': '\u1F148',
    'Z': '\u1F149'
  };

  // Wide (fullwidth) character map - offset from ASCII
  const WIDE_OFFSET = 0xFEE0; // Add to ASCII to get fullwidth

  // Bold character map (Mathematical Bold)
  const BOLD_MAP = {
    'A': '\u{1D400}', 'B': '\u{1D401}', 'C': '\u{1D402}', 'D': '\u{1D403}', 'E': '\u{1D404}',
    'F': '\u{1D405}', 'G': '\u{1D406}', 'H': '\u{1D407}', 'I': '\u{1D408}', 'J': '\u{1D409}',
    'K': '\u{1D40A}', 'L': '\u{1D40B}', 'M': '\u{1D40C}', 'N': '\u{1D40D}', 'O': '\u{1D40E}',
    'P': '\u{1D40F}', 'Q': '\u{1D410}', 'R': '\u{1D411}', 'S': '\u{1D412}', 'T': '\u{1D413}',
    'U': '\u{1D414}', 'V': '\u{1D415}', 'W': '\u{1D416}', 'X': '\u{1D417}', 'Y': '\u{1D418}',
    'Z': '\u{1D419}',
    'a': '\u{1D41A}', 'b': '\u{1D41B}', 'c': '\u{1D41C}', 'd': '\u{1D41D}', 'e': '\u{1D41E}',
    'f': '\u{1D41F}', 'g': '\u{1D420}', 'h': '\u{1D421}', 'i': '\u{1D422}', 'j': '\u{1D423}',
    'k': '\u{1D424}', 'l': '\u{1D425}', 'm': '\u{1D426}', 'n': '\u{1D427}', 'o': '\u{1D428}',
    'p': '\u{1D429}', 'q': '\u{1D42A}', 'r': '\u{1D42B}', 's': '\u{1D42C}', 't': '\u{1D42D}',
    'u': '\u{1D42E}', 'v': '\u{1D42F}', 'w': '\u{1D430}', 'x': '\u{1D431}', 'y': '\u{1D432}',
    'z': '\u{1D433}',
    '0': '\u{1D7CE}', '1': '\u{1D7CF}', '2': '\u{1D7D0}', '3': '\u{1D7D1}', '4': '\u{1D7D2}',
    '5': '\u{1D7D3}', '6': '\u{1D7D4}', '7': '\u{1D7D5}', '8': '\u{1D7D6}', '9': '\u{1D7D7}'
  };

  // Italic character map (Mathematical Italic)
  const ITALIC_MAP = {
    'A': '\u{1D434}', 'B': '\u{1D435}', 'C': '\u{1D436}', 'D': '\u{1D437}', 'E': '\u{1D438}',
    'F': '\u{1D439}', 'G': '\u{1D43A}', 'H': '\u{1D43B}', 'I': '\u{1D43C}', 'J': '\u{1D43D}',
    'K': '\u{1D43E}', 'L': '\u{1D43F}', 'M': '\u{1D440}', 'N': '\u{1D441}', 'O': '\u{1D442}',
    'P': '\u{1D443}', 'Q': '\u{1D444}', 'R': '\u{1D445}', 'S': '\u{1D446}', 'T': '\u{1D447}',
    'U': '\u{1D448}', 'V': '\u{1D449}', 'W': '\u{1D44A}', 'X': '\u{1D44B}', 'Y': '\u{1D44C}',
    'Z': '\u{1D44D}',
    'a': '\u{1D44E}', 'b': '\u{1D44F}', 'c': '\u{1D450}', 'd': '\u{1D451}', 'e': '\u{1D452}',
    'f': '\u{1D453}', 'g': '\u{1D454}', 'h': '\u{1D455}', 'i': '\u{1D456}', 'j': '\u{1D457}',
    'k': '\u{1D458}', 'l': '\u{1D459}', 'm': '\u{1D45A}', 'n': '\u{1D45B}', 'o': '\u{1D45C}',
    'p': '\u{1D45D}', 'q': '\u{1D45E}', 'r': '\u{1D45F}', 's': '\u{1D460}', 't': '\u{1D461}',
    'u': '\u{1D462}', 'v': '\u{1D463}', 'w': '\u{1D464}', 'x': '\u{1D465}', 'y': '\u{1D466}',
    'z': '\u{1D467}'
  };

  // Combining diacritical marks for zalgo effect
  const ZALGO_UP = [
    '\u030D', '\u030E', '\u0304', '\u0305', '\u033F', '\u0311', '\u0306',
    '\u0310', '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030A',
    '\u0342', '\u0343', '\u0344', '\u034A', '\u034B', '\u034C', '\u0303'
  ];
  const ZALGO_MID = [
    '\u0315', '\u031B', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322',
    '\u0327', '\u0328', '\u0334', '\u0335', '\u0336', '\u034F', '\u035C'
  ];
  const ZALGO_DOWN = [
    '\u0316', '\u0317', '\u0318', '\u0319', '\u031C', '\u031D', '\u031E',
    '\u031F', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032A',
    '\u032B', '\u032C', '\u032D', '\u032E', '\u032F', '\u0330', '\u0331'
  ];

  // Available effects with metadata
  const EFFECTS = [
    { id: 'upside-down', name: 'Upside Down', example: 'uʍop ǝpᴉsd∩' },
    { id: 'small-caps', name: 'Small Caps', example: '\u0455\u1D0D\u1D00\u029F\u029F \u1D04\u1D00\u1D18\u0455' },
    { id: 'superscript', name: 'Superscript', example: '\u02E2\u1D58\u1D56\u1D49\u02B3\u02E2\u1D9C\u02B3\u2071\u1D56\u1D57' },
    { id: 'subscript', name: 'Subscript', example: '\u209B\u1D64\u2095\u209B\u1D63\u1D62\u209A\u209C' },
    { id: 'bubble', name: 'Bubble', example: '\u24D1\u24E4\u24D1\u24D1\u24DB\u24D4' },
    { id: 'square', name: 'Square', example: '\u1F142\u1F140\u1F144\u1F130\u1F141\u1F134' },
    { id: 'strikethrough', name: 'Strikethrough', example: 's\u0336t\u0336r\u0336i\u0336k\u0336e\u0336' },
    { id: 'zalgo', name: 'Zalgo', example: 'z\u0352\u0316a\u0310\u0329l\u0357\u031Cg\u0351\u0320o\u0311\u0325' },
    { id: 'wide', name: 'Wide', example: '\uFF57\uFF49\uFF44\uFF45' },
    { id: 'bold', name: 'Bold', example: '\u{1D41B}\u{1D428}\u{1D425}\u{1D41D}' },
    { id: 'italic', name: 'Italic', example: '\u{1D456}\u{1D461}\u{1D44E}\u{1D459}\u{1D456}\u{1D450}' }
  ];

  /**
   * Transform text using a character map
   */
  function mapTransform(text, charMap, preserveCase = true) {
    return text.split('').map(char => {
      if (charMap[char]) {
        return charMap[char];
      }
      // Try lowercase version if uppercase not found
      if (preserveCase && charMap[char.toLowerCase()]) {
        return charMap[char.toLowerCase()];
      }
      return char;
    }).join('');
  }

  /**
   * Upside down transformation (flip and reverse)
   */
  function upsideDown(text) {
    return text.split('').map(char => UPSIDE_DOWN_MAP[char] || char).reverse().join('');
  }

  /**
   * Small caps transformation
   */
  function smallCaps(text) {
    return mapTransform(text.toLowerCase(), SMALL_CAPS_MAP);
  }

  /**
   * Superscript transformation
   */
  function superscript(text) {
    return mapTransform(text, SUPERSCRIPT_MAP);
  }

  /**
   * Subscript transformation
   */
  function subscript(text) {
    return mapTransform(text.toLowerCase(), SUBSCRIPT_MAP);
  }

  /**
   * Bubble (circled) transformation
   */
  function bubble(text) {
    return mapTransform(text, BUBBLE_MAP);
  }

  /**
   * Square transformation
   */
  function square(text) {
    return mapTransform(text.toUpperCase(), SQUARE_MAP);
  }

  /**
   * Strikethrough transformation (combining character)
   */
  function strikethrough(text) {
    return text.split('').map(char => char === ' ' ? char : char + '\u0336').join('');
  }

  /**
   * Zalgo transformation (subtle - 1-2 marks per character)
   */
  function zalgo(text) {
    return text.split('').map(char => {
      if (char === ' ') return char;
      let result = char;
      // Add 0-1 marks above
      if (Math.random() > 0.3) {
        result += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
      }
      // Add 0-1 marks below
      if (Math.random() > 0.3) {
        result += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
      }
      // Rarely add middle mark
      if (Math.random() > 0.7) {
        result += ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)];
      }
      return result;
    }).join('');
  }

  /**
   * Wide (fullwidth) transformation
   */
  function wide(text) {
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      // Only transform ASCII printable characters (33-126)
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(code + WIDE_OFFSET);
      }
      // Space becomes ideographic space
      if (char === ' ') return '\u3000';
      return char;
    }).join('');
  }

  /**
   * Bold transformation
   */
  function bold(text) {
    return mapTransform(text, BOLD_MAP);
  }

  /**
   * Italic transformation
   */
  function italic(text) {
    return mapTransform(text, ITALIC_MAP);
  }

  /**
   * Apply an effect by ID
   */
  function applyEffect(text, effectId) {
    if (!text || !effectId) return text;

    switch (effectId) {
      case 'upside-down': return upsideDown(text);
      case 'small-caps': return smallCaps(text);
      case 'superscript': return superscript(text);
      case 'subscript': return subscript(text);
      case 'bubble': return bubble(text);
      case 'square': return square(text);
      case 'strikethrough': return strikethrough(text);
      case 'zalgo': return zalgo(text);
      case 'wide': return wide(text);
      case 'bold': return bold(text);
      case 'italic': return italic(text);
      default: return text;
    }
  }

  /**
   * Get list of available effects
   */
  function getEffects() {
    return EFFECTS;
  }

  /**
   * Get effect by ID
   */
  function getEffect(effectId) {
    return EFFECTS.find(e => e.id === effectId);
  }

  // Public API
  return {
    applyEffect,
    getEffects,
    getEffect,
    // Individual transforms (for direct use if needed)
    upsideDown,
    smallCaps,
    superscript,
    subscript,
    bubble,
    square,
    strikethrough,
    zalgo,
    wide,
    bold,
    italic
  };
})();

// Export for global access
window.TextEffects = TextEffects;
