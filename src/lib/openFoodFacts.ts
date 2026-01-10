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

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { success: false, error: 'Product not found in database' };
    }

    return {
      success: true,
      product: {
        code: data.code,
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

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return { success: false, products: [], error: 'No products found' };
    }

    const products: OpenFoodFactsProduct[] = data.products
      .filter((p: any) => p.product_name && p.nutriments)
      .map((p: any) => ({
        code: p.code,
        product_name: p.product_name || p.product_name_en,
        brands: p.brands,
        serving_size: p.serving_size,
        serving_quantity: p.serving_quantity,
        nutriments: p.nutriments,
        image_url: p.image_url || p.image_front_url,
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
  
  // Prefer per 100g values, fall back to serving if not available
  const hasPer100g = nutriments['energy-kcal_100g'] !== undefined;
  const hasPerServing = nutriments['energy-kcal_serving'] !== undefined;
  
  return {
    name: product.product_name || 'Unknown Product',
    brand: product.brands || undefined,
    barcode: product.code,
    nutritionBasis: (hasPer100g ? 'per_100g' : 'per_serving') as const,
    macrosPer100g: hasPer100g ? {
      calories: Math.round(nutriments['energy-kcal_100g'] || 0),
      protein: Math.round(nutriments.proteins_100g || 0),
      carbs: Math.round(nutriments.carbohydrates_100g || 0),
      fat: Math.round(nutriments.fat_100g || 0),
    } : undefined,
    macrosPerServing: !hasPer100g && hasPerServing ? {
      calories: Math.round(nutriments['energy-kcal_serving'] || 0),
      protein: Math.round(nutriments.proteins_serving || 0),
      carbs: Math.round(nutriments.carbohydrates_serving || 0),
      fat: Math.round(nutriments.fat_serving || 0),
    } : undefined,
    servingGrams: product.serving_quantity || undefined,
    source: 'open_food_facts' as const,
  };
}
