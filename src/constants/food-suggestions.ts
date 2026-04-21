export type FoodSuggestion = {
  value: string
  label: string
  category?: string
}

/**
 * Curated food suggestions based on Google Places API (New) official types.
 * Sources:
 * - Google Places Table A Food and Drink types (italian_restaurant, sushi_restaurant, etc.)
 * - Google generativeSummary keywords (vegan, vegetarian, outdoor seating)
 * - Popular dishes that Google searchText handles well
 *
 * These values are optimized for Google Places text search queries and will yield
 * accurate restaurant results when used with the places:searchText endpoint.
 */
export const FOOD_SUGGESTIONS: FoodSuggestion[] = [
  // Cuisines - Official Google Place Types mapped to user-friendly labels
  { value: 'american_restaurant', label: 'American', category: 'Cuisine' },
  { value: 'chinese_restaurant', label: 'Chinese', category: 'Cuisine' },
  { value: 'french_restaurant', label: 'French', category: 'Cuisine' },
  { value: 'greek_restaurant', label: 'Greek', category: 'Cuisine' },
  { value: 'indian_restaurant', label: 'Indian', category: 'Cuisine' },
  { value: 'italian_restaurant', label: 'Italian', category: 'Cuisine' },
  { value: 'japanese_restaurant', label: 'Japanese', category: 'Cuisine' },
  { value: 'korean_restaurant', label: 'Korean', category: 'Cuisine' },
  {
    value: 'mediterranean_restaurant',
    label: 'Mediterranean',
    category: 'Cuisine',
  },
  { value: 'mexican_restaurant', label: 'Mexican', category: 'Cuisine' },
  { value: 'thai_restaurant', label: 'Thai', category: 'Cuisine' },
  { value: 'vietnamese_restaurant', label: 'Vietnamese', category: 'Cuisine' },
  { value: 'spanish_restaurant', label: 'Spanish', category: 'Cuisine' },
  { value: 'brazilian_restaurant', label: 'Brazilian', category: 'Cuisine' },
  { value: 'ethiopian_restaurant', label: 'Ethiopian', category: 'Cuisine' },
  { value: 'caribbean_restaurant', label: 'Caribbean', category: 'Cuisine' },
  { value: 'german_restaurant', label: 'German', category: 'Cuisine' },
  { value: 'turkish_restaurant', label: 'Turkish', category: 'Cuisine' },
  {
    value: 'middle_eastern_restaurant',
    label: 'Middle Eastern',
    category: 'Cuisine',
  },
  {
    value: 'asian_fusion_restaurant',
    label: 'Asian Fusion',
    category: 'Cuisine',
  },
  { value: 'cajun_restaurant', label: 'Cajun', category: 'Cuisine' },

  // Popular Dishes - High-search-volume terms Google handles well
  { value: 'sushi', label: 'Sushi', category: 'Dish' },
  { value: 'ramen', label: 'Ramen', category: 'Dish' },
  { value: 'pizza', label: 'Pizza', category: 'Dish' },
  { value: 'burgers', label: 'Burgers', category: 'Dish' },
  { value: 'tacos', label: 'Tacos', category: 'Dish' },
  { value: 'bbq', label: 'Barbecue', category: 'Dish' },
  { value: 'seafood', label: 'Seafood', category: 'Dish' },
  { value: 'steak', label: 'Steak', category: 'Dish' },
  { value: 'dim_sum', label: 'Dim Sum', category: 'Dish' },
  { value: 'pho', label: 'Pho', category: 'Dish' },
  { value: 'curry', label: 'Curry', category: 'Dish' },
  { value: 'hot_pot', label: 'Hot Pot', category: 'Dish' },
  { value: 'tapas', label: 'Tapas', category: 'Dish' },
  { value: 'falafel', label: 'Falafel', category: 'Dish' },
  { value: 'sandwiches', label: 'Sandwiches', category: 'Dish' },
  { value: 'salads', label: 'Salads', category: 'Dish' },
  { value: 'wings', label: 'Chicken Wings', category: 'Dish' },
  { value: 'dumplings', label: 'Dumplings', category: 'Dish' },
  { value: 'pasta', label: 'Pasta', category: 'Dish' },
  { value: 'noodles', label: 'Noodles', category: 'Dish' },

  // Dietary Preferences - From Google Place types and generativeSummary keywords
  { value: 'vegan_restaurant', label: 'Vegan', category: 'Dietary' },
  { value: 'vegetarian_restaurant', label: 'Vegetarian', category: 'Dietary' },
  { value: 'halal_restaurant', label: 'Halal', category: 'Dietary' },
  { value: 'kosher_restaurant', label: 'Kosher', category: 'Dietary' },
  { value: 'gluten_free', label: 'Gluten-Free', category: 'Dietary' },
  { value: 'healthy_food', label: 'Healthy', category: 'Dietary' },
  { value: 'organic', label: 'Organic', category: 'Dietary' },
  { value: 'farm_to_table', label: 'Farm to Table', category: 'Dietary' },

  // Dining Styles & Atmosphere - Official Google Place types and common modifiers
  { value: 'fine_dining_restaurant', label: 'Fine Dining', category: 'Style' },
  { value: 'fast_food_restaurant', label: 'Fast Food', category: 'Style' },
  { value: 'family_restaurant', label: 'Family-Friendly', category: 'Style' },
  { value: 'breakfast_restaurant', label: 'Breakfast', category: 'Style' },
  { value: 'brunch_restaurant', label: 'Brunch', category: 'Style' },
  { value: 'cafe', label: 'Cafe', category: 'Style' },
  { value: 'bakery', label: 'Bakery', category: 'Style' },
  { value: 'brewpub', label: 'Brewpub', category: 'Style' },
  { value: 'wine_bar', label: 'Wine Bar', category: 'Style' },
  { value: 'cocktail_bar', label: 'Cocktails', category: 'Style' },
  { value: 'gastropub', label: 'Gastropub', category: 'Style' },
  { value: 'food_truck', label: 'Food Truck', category: 'Style' },
  { value: 'buffet_restaurant', label: 'Buffet', category: 'Style' },
  { value: 'dessert_shop', label: 'Dessert', category: 'Style' },
  { value: 'ice_cream_shop', label: 'Ice Cream', category: 'Style' },
  { value: 'donut_shop', label: 'Donuts', category: 'Style' },
  { value: 'bagel_shop', label: 'Bagels', category: 'Style' },
  { value: 'coffee_shop', label: 'Coffee Shop', category: 'Style' },
  { value: 'tea_house', label: 'Tea House', category: 'Style' },
  { value: 'hookah_bar', label: 'Hookah Lounge', category: 'Style' },
  { value: 'sports_bar', label: 'Sports Bar', category: 'Style' },
  { value: 'rooftop', label: 'Rooftop', category: 'Style' },
  { value: 'outdoor_seating', label: 'Outdoor Seating', category: 'Style' },
  { value: 'waterfront', label: 'Waterfront', category: 'Style' },
  { value: 'live_music', label: 'Live Music', category: 'Style' },
  { value: 'romantic', label: 'Romantic', category: 'Vibe' },
  { value: 'cozy', label: 'Cozy', category: 'Vibe' },
  { value: 'modern', label: 'Modern', category: 'Vibe' },
  { value: 'trendy', label: 'Trendy', category: 'Vibe' },
  { value: 'intimate', label: 'Intimate', category: 'Vibe' },
  { value: 'casual', label: 'Casual', category: 'Vibe' },
  { value: 'upscale', label: 'Upscale', category: 'Vibe' },
  { value: 'authentic', label: 'Authentic', category: 'Vibe' },
  { value: 'fusion', label: 'Fusion', category: 'Vibe' },
]
