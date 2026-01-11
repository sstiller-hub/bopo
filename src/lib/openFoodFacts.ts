// Open Food Facts API integration
// https://world.openfoodfacts.org/

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
  };
  image_url?: string;
}

interface OpenFoodFactsApiProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OpenFoodFactsProduct['nutriments'];
  image_url?: string;
  image_front_url?: string;
}

interface OpenFoodFactsBarcodeResponse {
  status: number;
  code?: string;
  product?: OpenFoodFactsApiProduct;
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsApiProduct[];
}

export interface FetchProductResult {
  success: boolean;
  product?: OpenFoodFactsProduct;
  error?: string;
}

export interface SearchProductsResult {
  success: boolean;
  products: OpenFoodFactsProduct[];
  error?: string;
}

const GRAMS_PER_OUNCE = 28.3495;

function parseServingGrams(label?: string) {
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  const gramsMatch = normalized.match(/([\d.]+)\s*g\b/);
  if (gramsMatch) {
    const gramsValue = parseFloat(gramsMatch[1]);
    if (!Number.isNaN(gramsValue)) {
      return Math.round(gramsValue);
    }
  }
  const ouncesMatch = normalized.match(/([\d.]+)\s*oz\b/);
  if (ouncesMatch) {
    const ouncesValue = parseFloat(ouncesMatch[1]);
    if (!Number.isNaN(ouncesValue)) {
      return Math.round(ouncesValue * GRAMS_PER_OUNCE);
    }
  }
  return undefined;
}

export async function fetchProductByBarcode(barcode: string): Promise<FetchProductResult> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'MacroTracker - Lovable App',
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch product data' };
    }

    const data: OpenFoodFactsBarcodeResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return { success: false, error: 'Product not found in database' };
    }

    return {
      success: true,
      product: {
        code: data.code ?? data.product.code,
        product_name: data.product.product_name || data.product.product_name_en,
        brands: data.product.brands,
        serving_size: data.product.serving_size,
        serving_quantity: data.product.serving_quantity,
        nutriments: data.product.nutriments,
        image_url: data.product.image_url || data.product.image_front_url,
      },
    };
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}

export async function searchProducts(query: string, limit = 20): Promise<SearchProductsResult> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`,
      {
        headers: {
          'User-Agent': 'MacroTracker - Lovable App',
        },
      }
    );

    if (!response.ok) {
      return { success: false, products: [], error: 'Failed to search products' };
    }

    const data: OpenFoodFactsSearchResponse = await response.json();
    const apiProducts = data.products ?? [];

    if (apiProducts.length === 0) {
      return { success: false, products: [], error: 'No products found' };
    }

    const products: OpenFoodFactsProduct[] = apiProducts
      .filter((product) => product.product_name && product.nutriments)
      .map((product) => ({
        code: product.code,
        product_name: product.product_name || product.product_name_en,
        brands: product.brands,
        serving_size: product.serving_size,
        serving_quantity: product.serving_quantity,
        nutriments: product.nutriments,
        image_url: product.image_url || product.image_front_url,
      }));

    return { success: true, products };
  } catch (error) {
    console.error('Open Food Facts search error:', error);
    return { success: false, products: [], error: 'Network error - please try again' };
  }
}

// Convert Open Food Facts product to our Food format
export function convertToFoodData(product: OpenFoodFactsProduct) {
  const nutriments = product.nutriments || {};
  const servingLabel = product.serving_size?.trim() || undefined;
  const servingQuantity = typeof product.serving_quantity === 'number' && product.serving_quantity > 0
    ? product.serving_quantity
    : undefined;
  const servingGrams = parseServingGrams(servingLabel)
    ?? (servingQuantity && (servingLabel ? servingQuantity > 1 : true)
      ? Math.round(servingQuantity)
      : undefined);
  
  // Prefer per 100g values, fall back to serving if not available
  const hasPer100g = nutriments['energy-kcal_100g'] !== undefined;
  const hasPerServing = nutriments['energy-kcal_serving'] !== undefined;
  const hasServingGrams = servingGrams !== undefined;
  
  return {
    name: product.product_name || 'Unknown Product',
    brand: product.brands || undefined,
    barcode: product.code,
    nutritionBasis: (hasPerServing && hasServingGrams ? 'per_serving' : 'per_100g') as const,
    macrosPer100g: hasPer100g ? {
      calories: Math.round(nutriments['energy-kcal_100g'] || 0),
      protein: Math.round(nutriments.proteins_100g || 0),
      carbs: Math.round(nutriments.carbohydrates_100g || 0),
      fat: Math.round(nutriments.fat_100g || 0),
    } : undefined,
    macrosPerServing: hasPerServing ? {
      calories: Math.round(nutriments['energy-kcal_serving'] || 0),
      protein: Math.round(nutriments.proteins_serving || 0),
      carbs: Math.round(nutriments.carbohydrates_serving || 0),
      fat: Math.round(nutriments.fat_serving || 0),
    } : undefined,
    servingGrams,
    servingLabel,
    source: 'open_food_facts' as const,
  };
}
