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

// Convert Open Food Facts product to our Food format
export function convertToFoodData(product: OpenFoodFactsProduct) {
  const nutriments = product.nutriments || {};
  
  // Prefer per 100g values, fall back to serving if not available
  const hasPer100g = nutriments['energy-kcal_100g'] !== undefined;
  
  return {
    name: product.product_name || 'Unknown Product',
    brand: product.brands || undefined,
    barcode: product.code,
    nutritionBasis: 'per_100g' as const,
    macrosPer100g: hasPer100g ? {
      calories: Math.round(nutriments['energy-kcal_100g'] || 0),
      protein: Math.round(nutriments.proteins_100g || 0),
      carbs: Math.round(nutriments.carbohydrates_100g || 0),
      fat: Math.round(nutriments.fat_100g || 0),
    } : undefined,
    servingGrams: product.serving_quantity || undefined,
    source: 'open_food_facts' as const,
  };
}