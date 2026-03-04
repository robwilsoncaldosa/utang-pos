import { PosDashboard } from "@/components/pos/pos-dashboard";
import { fetchCategories, fetchProducts } from "@/lib/supabase/queries";

export default async function Home() {
  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] =
    await Promise.all([fetchCategories(), fetchProducts()]);

  return (
    <PosDashboard
      categories={categories}
      products={products}
      categoriesError={categoriesError}
      productsError={productsError}
    />
  );
}
