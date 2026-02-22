export const VAT_PERCENT = 12;

/** Mock categories for POS dashboard (replace with DB later) */
export const MOCK_CATEGORIES = [
  { id: "all", name: "All" },
  { id: "drinks", name: "Drinks" },
] as const;

/** Mock products for POS dashboard (replace with Supabase later) */
export const MOCK_PRODUCTS = [
  { id: "1", name: "Coke 270 ML", price: 20, stock: 13, categoryId: "drinks", imageUrl: null },
  { id: "2", name: "Kopiko Lucky Day 3-in-1", price: 25, stock: 10, categoryId: "drinks", imageUrl: null },
  { id: "3", name: "Yakult Original", price: 30, stock: 15, categoryId: "drinks", imageUrl: null },
  { id: "4", name: "Alpine Evap Milk", price: 12, stock: 8, categoryId: "drinks", imageUrl: null },
  { id: "5", name: "C2 Apple Green Tea", price: 22, stock: 12, categoryId: "drinks", imageUrl: null },
  { id: "6", name: "Royal", price: 18, stock: 20, categoryId: "drinks", imageUrl: null },
  { id: "7", name: "Pepsi 355ml", price: 20, stock: 5, categoryId: "drinks", imageUrl: null },
  { id: "8", name: "Sprite 330ml", price: 20, stock: 22, categoryId: "drinks", imageUrl: null },
] as const;

export type MockProduct = (typeof MOCK_PRODUCTS)[number];
export type MockCategoryId = (typeof MOCK_CATEGORIES)[number]["id"];
