/**
 * Icon utility module for Vitamix blocks
 * Provides easy access to Spectrum-style SVG icons
 */

// Icon registry with categories and tags for semantic lookup
export const ICON_REGISTRY = {
  // Product Features
  speed: { category: 'product', tags: ['performance', 'fast', 'rpm', 'variable'] },
  power: { category: 'product', tags: ['watt', 'motor', 'energy', 'lightning'] },
  warranty: { category: 'product', tags: ['guarantee', 'protection', 'years', 'shield'] },
  motor: { category: 'product', tags: ['engine', 'power', 'performance'] },
  capacity: { category: 'product', tags: ['size', 'volume', 'ounces', 'container'] },
  noise: { category: 'product', tags: ['sound', 'quiet', 'decibel', 'volume'] },
  'self-cleaning': { category: 'product', tags: ['clean', 'wash', 'automatic', 'easy'] },
  blender: { category: 'product', tags: ['vitamix', 'appliance', 'machine'] },

  // Recipe Categories
  breakfast: { category: 'recipe', tags: ['morning', 'meal', 'eggs', 'smoothie'] },
  lunch: { category: 'recipe', tags: ['midday', 'meal', 'salad', 'sandwich'] },
  dinner: { category: 'recipe', tags: ['evening', 'meal', 'main', 'course'] },
  dessert: { category: 'recipe', tags: ['sweet', 'treat', 'ice cream', 'cake'] },
  drinks: { category: 'recipe', tags: ['beverage', 'cocktail', 'juice', 'smoothie'] },
  soup: { category: 'recipe', tags: ['hot', 'warm', 'broth', 'puree'] },
  frozen: { category: 'recipe', tags: ['ice', 'cold', 'frozen dessert', 'sorbet'] },
  smoothie: { category: 'recipe', tags: ['drink', 'blend', 'fruit', 'healthy'] },
  recipe: { category: 'recipe', tags: ['instructions', 'cooking', 'preparation'] },

  // Cooking Actions
  blend: { category: 'action', tags: ['mix', 'combine', 'puree', 'process'] },
  pulse: { category: 'action', tags: ['burst', 'quick', 'chop', 'control'] },
  chop: { category: 'action', tags: ['cut', 'dice', 'mince', 'knife'] },
  puree: { category: 'action', tags: ['smooth', 'blend', 'cream', 'process'] },
  mix: { category: 'action', tags: ['combine', 'stir', 'blend', 'fold'] },
  grind: { category: 'action', tags: ['mill', 'powder', 'coffee', 'spice'] },

  // Ingredients
  fruit: { category: 'ingredient', tags: ['apple', 'berry', 'citrus', 'fresh'] },
  vegetable: { category: 'ingredient', tags: ['carrot', 'leafy', 'green', 'produce'] },
  protein: { category: 'ingredient', tags: ['meat', 'tofu', 'beans', 'nuts'] },
  dairy: { category: 'ingredient', tags: ['milk', 'yogurt', 'cheese', 'cream'] },
  nuts: { category: 'ingredient', tags: ['almond', 'walnut', 'seed', 'butter'] },
  ingredient: { category: 'ingredient', tags: ['food', 'item', 'component'] },

  // Nutrition & Health
  nutrition: { category: 'nutrition', tags: ['health', 'wellness', 'diet', 'heart'] },
  calories: { category: 'nutrition', tags: ['energy', 'kcal', 'diet', 'fire'] },
  fiber: { category: 'nutrition', tags: ['digestive', 'whole grain', 'health'] },
  vitamins: { category: 'nutrition', tags: ['supplement', 'health', 'nutrient'] },
  organic: { category: 'nutrition', tags: ['natural', 'clean', 'healthy', 'leaf'] },
  'gluten-free': { category: 'nutrition', tags: ['celiac', 'wheat-free', 'diet'] },
  vegan: { category: 'nutrition', tags: ['plant-based', 'vegetarian', 'diet'] },
  'low-sugar': { category: 'nutrition', tags: ['diabetic', 'healthy', 'diet'] },

  // Recipe Metadata
  timer: { category: 'meta', tags: ['time', 'duration', 'clock', 'minutes'] },
  'prep-time': { category: 'meta', tags: ['preparation', 'clock', 'duration'] },
  servings: { category: 'meta', tags: ['portions', 'yield', 'people', 'amount'] },
  difficulty: { category: 'meta', tags: ['level', 'easy', 'hard', 'skill'] },

  // UI Elements
  check: { category: 'ui', tags: ['done', 'complete', 'success', 'yes'] },
  'check-circle': { category: 'ui', tags: ['done', 'complete', 'success', 'verified'] },
  info: { category: 'ui', tags: ['information', 'help', 'details', 'about'] },
  warning: { category: 'ui', tags: ['alert', 'caution', 'attention', 'error'] },
  star: { category: 'ui', tags: ['rating', 'favorite', 'featured', 'best'] },
  heart: { category: 'ui', tags: ['love', 'favorite', 'like', 'save'] },
  'arrow-right': { category: 'ui', tags: ['next', 'forward', 'continue', 'go'] },
  'arrow-left': { category: 'ui', tags: ['back', 'previous', 'return'] },
  close: { category: 'ui', tags: ['x', 'cancel', 'dismiss', 'remove'] },
  plus: { category: 'ui', tags: ['add', 'new', 'create', 'expand'] },
  minus: { category: 'ui', tags: ['remove', 'subtract', 'collapse', 'less'] },
  'external-link': { category: 'ui', tags: ['open', 'new tab', 'link', 'external'] },
};

// Cache for loaded icons
const iconCache = new Map();

/**
 * Get the URL for an icon
 * @param {string} name - Icon name (without .svg extension)
 * @returns {string} Icon URL path
 */
export function getIconUrl(name) {
  return `/icons/${name}.svg`;
}

/**
 * Load an icon SVG and return its content
 * @param {string} name - Icon name
 * @returns {Promise<string>} SVG content
 */
export async function loadIcon(name) {
  if (iconCache.has(name)) {
    return iconCache.get(name);
  }

  try {
    const response = await fetch(getIconUrl(name));
    if (!response.ok) {
      console.warn(`[Icons] Icon not found: ${name}`);
      return null;
    }
    const svg = await response.text();
    iconCache.set(name, svg);
    return svg;
  } catch (error) {
    console.error(`[Icons] Failed to load icon: ${name}`, error);
    return null;
  }
}

/**
 * Load multiple icons in parallel
 * @param {string[]} names - Array of icon names
 * @returns {Promise<Map<string, string>>} Map of icon name to SVG content
 */
export async function loadIcons(names) {
  const results = await Promise.all(names.map((name) => loadIcon(name)));
  const map = new Map();
  names.forEach((name, i) => {
    if (results[i]) {
      map.set(name, results[i]);
    }
  });
  return map;
}

/**
 * Create an icon element with proper sizing and color inheritance
 * @param {string} name - Icon name
 * @param {Object} options - Options
 * @param {number} options.size - Icon size in pixels (default: 24)
 * @param {string} options.className - Additional CSS class
 * @param {string} options.color - Color override (default: currentColor)
 * @param {string} options.label - Accessible label
 * @returns {Promise<HTMLElement>} Icon wrapper element
 */
export async function createIcon(name, options = {}) {
  const {
    size = 24,
    className = '',
    color = 'currentColor',
    label = '',
  } = options;

  const wrapper = document.createElement('span');
  wrapper.className = `icon icon-${name} ${className}`.trim();
  wrapper.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${size}px;
    height: ${size}px;
    color: ${color};
  `;

  if (label) {
    wrapper.setAttribute('aria-label', label);
    wrapper.setAttribute('role', 'img');
  } else {
    wrapper.setAttribute('aria-hidden', 'true');
  }

  const svg = await loadIcon(name);
  if (svg) {
    wrapper.innerHTML = svg;
    const svgEl = wrapper.querySelector('svg');
    if (svgEl) {
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
    }
  }

  return wrapper;
}

/**
 * Create an icon element synchronously using an img tag
 * Use this when you need immediate rendering without async
 * @param {string} name - Icon name
 * @param {Object} options - Options (same as createIcon)
 * @returns {HTMLElement} Icon wrapper element
 */
export function createIconSync(name, options = {}) {
  const {
    size = 24,
    className = '',
    label = '',
  } = options;

  const wrapper = document.createElement('span');
  wrapper.className = `icon icon-${name} ${className}`.trim();
  wrapper.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${size}px;
    height: ${size}px;
  `;

  const img = document.createElement('img');
  img.src = getIconUrl(name);
  img.style.cssText = 'width: 100%; height: 100%;';

  if (label) {
    img.alt = label;
    wrapper.setAttribute('role', 'img');
  } else {
    img.alt = '';
    wrapper.setAttribute('aria-hidden', 'true');
  }

  wrapper.appendChild(img);
  return wrapper;
}

/**
 * Find icons by category
 * @param {string} category - Category name
 * @returns {string[]} Array of icon names
 */
export function getIconsByCategory(category) {
  return Object.entries(ICON_REGISTRY)
    .filter(([, meta]) => meta.category === category)
    .map(([name]) => name);
}

/**
 * Find icons by tag (semantic search)
 * @param {string} tag - Tag to search for
 * @returns {string[]} Array of matching icon names
 */
export function findIconsByTag(tag) {
  const normalizedTag = tag.toLowerCase();
  return Object.entries(ICON_REGISTRY)
    .filter(([, meta]) => meta.tags.some((t) => t.includes(normalizedTag)))
    .map(([name]) => name);
}

/**
 * Get all available icon names
 * @returns {string[]} Array of all icon names
 */
export function getAllIconNames() {
  return Object.keys(ICON_REGISTRY);
}

/**
 * Get all categories
 * @returns {string[]} Array of category names
 */
export function getCategories() {
  const categories = new Set(Object.values(ICON_REGISTRY).map((m) => m.category));
  return [...categories];
}

/**
 * Decorate an element with an icon prefix
 * Adds icon before the element's content
 * @param {HTMLElement} element - Element to decorate
 * @param {string} iconName - Icon name
 * @param {Object} options - Icon options
 */
export async function decorateWithIcon(element, iconName, options = {}) {
  const icon = await createIcon(iconName, { size: 20, ...options });
  icon.style.marginRight = '8px';
  element.insertBefore(icon, element.firstChild);
}

/**
 * Auto-detect and add icons to elements based on their text content
 * @param {HTMLElement} container - Container to search within
 * @param {Object} mapping - Text to icon mapping
 */
export async function autoDecorateIcons(container, mapping = {}) {
  const defaultMapping = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    dessert: 'dessert',
    smoothie: 'smoothie',
    soup: 'soup',
    frozen: 'frozen',
    vegan: 'vegan',
    'gluten-free': 'gluten-free',
    organic: 'organic',
    'prep time': 'prep-time',
    servings: 'servings',
    difficulty: 'difficulty',
    calories: 'calories',
    protein: 'protein',
    fiber: 'fiber',
    ...mapping,
  };

  const elements = container.querySelectorAll('span, li, dt, th, td, label');
  for (const el of elements) {
    const text = el.textContent.toLowerCase().trim();
    for (const [keyword, iconName] of Object.entries(defaultMapping)) {
      if (text.includes(keyword) && !el.querySelector('.icon')) {
        // eslint-disable-next-line no-await-in-loop
        await decorateWithIcon(el, iconName, { size: 16 });
        break;
      }
    }
  }
}

export default {
  ICON_REGISTRY,
  getIconUrl,
  loadIcon,
  loadIcons,
  createIcon,
  createIconSync,
  getIconsByCategory,
  findIconsByTag,
  getAllIconNames,
  getCategories,
  decorateWithIcon,
  autoDecorateIcons,
};
