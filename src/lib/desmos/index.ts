/**
 * Desmos API Integration for MathPivot TutorOS
 * Provides interactive graphing calculator functionality
 *
 * Note: Desmos provides a free API for educational use.
 * The calculator is embedded client-side using their JavaScript API.
 */

/**
 * Desmos calculator configuration
 */
export interface DesmosConfig {
  expressionsTopbar?: boolean;
  settingsMenu?: boolean;
  zoomButtons?: boolean;
  expressions?: boolean;
  lockViewport?: boolean;
  border?: boolean;
  keypad?: boolean;
  graphpaper?: boolean;
  fontSize?: number;
  projectorMode?: boolean;
}

/**
 * Default configuration for embedded calculator
 */
export const DEFAULT_DESMOS_CONFIG: DesmosConfig = {
  expressionsTopbar: true,
  settingsMenu: true,
  zoomButtons: true,
  expressions: true,
  lockViewport: false,
  border: true,
  keypad: true,
  graphpaper: true,
  fontSize: 16,
  projectorMode: false,
};

/**
 * Simplified config for tutoring sessions
 */
export const TUTORING_DESMOS_CONFIG: DesmosConfig = {
  expressionsTopbar: true,
  settingsMenu: false,
  zoomButtons: true,
  expressions: true,
  lockViewport: false,
  border: false,
  keypad: true,
  graphpaper: true,
  fontSize: 18,
  projectorMode: true, // Better visibility
};

/**
 * Read-only config for viewing saved states
 */
export const READONLY_DESMOS_CONFIG: DesmosConfig = {
  expressionsTopbar: false,
  settingsMenu: false,
  zoomButtons: true,
  expressions: false,
  lockViewport: true,
  border: true,
  keypad: false,
  graphpaper: true,
  fontSize: 16,
  projectorMode: false,
};

/**
 * Desmos calculator state (can be saved/loaded)
 */
export interface DesmosState {
  version: number;
  randomSeed: string;
  graph: {
    viewport: {
      xmin: number;
      ymin: number;
      xmax: number;
      ymax: number;
    };
  };
  expressions: {
    list: DesmosExpression[];
  };
}

/**
 * A single expression in Desmos
 */
export interface DesmosExpression {
  id: string;
  type: 'expression' | 'table' | 'text' | 'folder';
  latex?: string;
  color?: string;
  lineStyle?: 'SOLID' | 'DASHED' | 'DOTTED';
  lineWidth?: string;
  pointStyle?: 'POINT' | 'OPEN' | 'CROSS';
  pointSize?: string;
  hidden?: boolean;
  secret?: boolean;
  folderId?: string;
}

/**
 * Common math expressions for quick insertion
 */
export const COMMON_EXPRESSIONS = {
  // Linear
  linearFunction: 'y = mx + b',
  slope: 'm = \\frac{y_2 - y_1}{x_2 - x_1}',
  pointSlope: 'y - y_1 = m(x - x_1)',

  // Quadratic
  quadraticStandard: 'y = ax^2 + bx + c',
  quadraticVertex: 'y = a(x - h)^2 + k',
  quadraticFormula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',

  // Polynomials
  cubic: 'y = ax^3 + bx^2 + cx + d',
  polynomial: 'y = \\sum_{i=0}^{n} a_i x^i',

  // Exponential & Logarithmic
  exponential: 'y = a \\cdot b^x',
  naturalExp: 'y = e^x',
  logarithm: 'y = \\log_b(x)',
  naturalLog: 'y = \\ln(x)',

  // Trigonometric
  sine: 'y = a \\sin(bx + c) + d',
  cosine: 'y = a \\cos(bx + c) + d',
  tangent: 'y = \\tan(x)',

  // Circle & Conic Sections
  circleStandard: '(x - h)^2 + (y - k)^2 = r^2',
  ellipse: '\\frac{(x-h)^2}{a^2} + \\frac{(y-k)^2}{b^2} = 1',
  parabola: 'y = \\frac{1}{4p}(x - h)^2 + k',
  hyperbola: '\\frac{(x-h)^2}{a^2} - \\frac{(y-k)^2}{b^2} = 1',

  // Calculus
  derivative: "f'(x) = \\frac{d}{dx}[f(x)]",
  integral: '\\int_a^b f(x) dx',
  limit: '\\lim_{x \\to a} f(x)',

  // Statistics
  mean: '\\bar{x} = \\frac{\\sum x_i}{n}',
  standardDev: 's = \\sqrt{\\frac{\\sum(x_i - \\bar{x})^2}{n-1}}',
  normalDist: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
};

/**
 * Pre-built graph states for common topics
 */
export const TEMPLATE_GRAPHS: Record<string, Partial<DesmosState>> = {
  linearExplorer: {
    expressions: {
      list: [
        { id: '1', type: 'expression', latex: 'y = mx + b' },
        { id: '2', type: 'expression', latex: 'm = 1' },
        { id: '3', type: 'expression', latex: 'b = 0' },
        { id: '4', type: 'expression', latex: '(0, b)', color: '#c74440' },
      ],
    },
  },
  quadraticExplorer: {
    expressions: {
      list: [
        { id: '1', type: 'expression', latex: 'y = a(x - h)^2 + k' },
        { id: '2', type: 'expression', latex: 'a = 1' },
        { id: '3', type: 'expression', latex: 'h = 0' },
        { id: '4', type: 'expression', latex: 'k = 0' },
        { id: '5', type: 'expression', latex: '(h, k)', color: '#c74440' },
      ],
    },
  },
  trigExplorer: {
    expressions: {
      list: [
        { id: '1', type: 'expression', latex: 'y = A\\sin(Bx + C) + D' },
        { id: '2', type: 'expression', latex: 'A = 1' },
        { id: '3', type: 'expression', latex: 'B = 1' },
        { id: '4', type: 'expression', latex: 'C = 0' },
        { id: '5', type: 'expression', latex: 'D = 0' },
      ],
    },
  },
  unitCircle: {
    expressions: {
      list: [
        { id: '1', type: 'expression', latex: 'x^2 + y^2 = 1' },
        { id: '2', type: 'expression', latex: '(\\cos(\\theta), \\sin(\\theta))', color: '#c74440' },
        { id: '3', type: 'expression', latex: '\\theta = 0' },
        { id: '4', type: 'expression', latex: '0 \\le \\theta \\le 2\\pi' },
      ],
    },
  },
  derivativeExplorer: {
    expressions: {
      list: [
        { id: '1', type: 'expression', latex: 'f(x) = x^2' },
        { id: '2', type: 'expression', latex: "f'(x) = 2x", color: '#2d70b3' },
        { id: '3', type: 'expression', latex: 'a = 1' },
        { id: '4', type: 'expression', latex: '(a, f(a))', color: '#c74440' },
        { id: '5', type: 'expression', latex: "y = f'(a)(x - a) + f(a)", lineStyle: 'DASHED' },
      ],
    },
  },
};

/**
 * Generate Desmos embed URL for sharing
 */
export function getDesmosEmbedUrl(state?: string): string {
  if (state) {
    // If we have a saved state hash
    return `https://www.desmos.com/calculator/${state}`;
  }
  return 'https://www.desmos.com/calculator';
}

/**
 * Get the Desmos API script URL
 */
export function getDesmosApiUrl(): string {
  return 'https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
}

/**
 * Generate React component props for Desmos embed
 */
export function getDesmosEmbedProps(config: DesmosConfig = DEFAULT_DESMOS_CONFIG) {
  return {
    apiUrl: getDesmosApiUrl(),
    config,
  };
}

/**
 * Serialize graph state to JSON string
 */
export function serializeGraphState(state: DesmosState): string {
  return JSON.stringify(state);
}

/**
 * Parse JSON string to graph state
 */
export function parseGraphState(json: string): DesmosState | null {
  try {
    return JSON.parse(json) as DesmosState;
  } catch {
    return null;
  }
}

/**
 * Create a shareable state for a specific skill topic
 */
export function createSkillGraph(
  skillCode: string
): { config: DesmosConfig; expressions: DesmosExpression[] } {
  // Map skill codes to appropriate graph templates
  const skillGraphs: Record<string, keyof typeof TEMPLATE_GRAPHS> = {
    'LIN-001': 'linearExplorer',
    'LIN-002': 'linearExplorer',
    'QUAD-001': 'quadraticExplorer',
    'QUAD-002': 'quadraticExplorer',
    'TRIG-001': 'trigExplorer',
    'TRIG-002': 'unitCircle',
    'CALC-001': 'derivativeExplorer',
  };

  const templateKey = skillGraphs[skillCode] || 'linearExplorer';
  const template = TEMPLATE_GRAPHS[templateKey];

  return {
    config: TUTORING_DESMOS_CONFIG,
    expressions: template.expressions?.list || [],
  };
}
