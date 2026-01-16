/**
 * Commercial Products Configuration
 *
 * Maps commercial product names to their primary images and metadata.
 * Used for generating product cards and recommendations for B2B queries.
 */

export interface CommercialProduct {
  id: string;
  name: string;
  shortName: string;
  imageUrl: string;
  productUrl: string;
  category: 'blender' | 'system' | 'container';
  bestFor: string[];
  features: string[];
}

export const COMMERCIAL_PRODUCTS: CommercialProduct[] = [
  {
    id: 'quick-quiet',
    name: 'Quick & Quiet',
    shortName: 'Quick & Quiet',
    imageUrl: 'https://www.vitamix.com/vr/en_us/media_18fbdf0060d121273469bde5e1717c19e7024b7ea.avif?width=2000&format=webply&optimize=medium',
    productUrl: 'https://www.vitamix.com/vr/en_us/commercial/products/quick-and-quiet',
    category: 'blender',
    bestFor: ['high-volume beverage service', 'juice bars', 'smoothie bars', 'quick service'],
    features: ['Accelerate container', 'Quiet operation', 'High-duty cycle', '700-hour warranty'],
  },
  {
    id: 'quiet-one',
    name: 'The Quiet One',
    shortName: 'The Quiet One',
    imageUrl: 'https://www.vitamix.com/vr/en_us/media_1a218a4d1ddefd76a4988312570922a56401af0c9.avif?width=2000&format=webply&optimize=medium',
    productUrl: 'https://www.vitamix.com/vr/en_us/commercial/products/the-quiet-one',
    category: 'blender',
    bestFor: ['front-of-house', 'cafes', 'coffee shops', 'fine dining'],
    features: ['Sound enclosure', '34 programs', 'One-button operation', 'Aerating container compatible'],
  },
  {
    id: 'vita-prep',
    name: 'Vita-Prep 3',
    shortName: 'Vita-Prep',
    imageUrl: 'https://www.vitamix.com/vr/en_us/media_10e23c3177a71c88f42d49908b8e97e7b0ba4f96b.avif?width=2000&format=webply&optimize=medium',
    productUrl: 'https://www.vitamix.com/vr/en_us/commercial/products/vita-prep-3',
    category: 'blender',
    bestFor: ['professional kitchens', 'restaurants', 'back-of-house', 'food prep'],
    features: ['Variable speed', 'Pulse function', 'Durable construction', '3-year warranty'],
  },
  {
    id: 'vitamix-xl',
    name: 'Vitamix XL',
    shortName: 'The XL',
    imageUrl: 'https://www.vitamix.com/vr/en_us/media_1ade32ab77d597fe18650da3242beecef488955b7.avif?width=2000&format=webply&optimize=medium',
    productUrl: 'https://www.vitamix.com/vr/en_us/commercial/products/vitamix-xl',
    category: 'blender',
    bestFor: ['large batch preparation', 'catering', 'high-volume operations', 'institutional'],
    features: ['1.5 gallon capacity', 'Variable speed', 'Commercial-grade motor', 'NSF certified'],
  },
  {
    id: 'drink-machine-advance',
    name: 'Drink Machine Advance',
    shortName: 'Drink Machine',
    imageUrl: 'https://www.vitamix.com/vr/en_us/media_1a218a4d1ddefd76a4988312570922a56401af0c9.avif?width=2000&format=webply&optimize=medium',
    productUrl: 'https://www.vitamix.com/vr/en_us/commercial/products/drink-machine-advance',
    category: 'blender',
    bestFor: ['beverage programs', 'smoothies', 'frozen drinks', 'cocktails'],
    features: ['Programmable', 'Consistent results', 'Easy operation', '3-year warranty'],
  },
];

/**
 * Get a commercial product by ID or name
 */
export function getCommercialProduct(idOrName: string): CommercialProduct | undefined {
  const search = idOrName.toLowerCase();
  return COMMERCIAL_PRODUCTS.find(
    p => p.id === search ||
         p.name.toLowerCase().includes(search) ||
         p.shortName.toLowerCase().includes(search)
  );
}

/**
 * Get all commercial products
 */
export function getAllCommercialProducts(): CommercialProduct[] {
  return COMMERCIAL_PRODUCTS;
}

/**
 * Get commercial products by use case
 */
export function getCommercialProductsByUseCase(useCase: string): CommercialProduct[] {
  const search = useCase.toLowerCase();
  return COMMERCIAL_PRODUCTS.filter(p =>
    p.bestFor.some(bf => bf.toLowerCase().includes(search))
  );
}

/**
 * Get the image URL for a commercial product by name
 */
export function getCommercialProductImage(productName: string): string | undefined {
  const product = getCommercialProduct(productName);
  return product?.imageUrl;
}
