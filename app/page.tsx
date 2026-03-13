import { PosDashboard } from "@/components/pos/pos-dashboard";
import { fetchCategories, fetchProducts, fetchUser } from "@/lib/supabase/queries";

export default async function Home() {
  const [
    { data: categories, error: categoriesError },
    { data: products, error: productsError },
    { data: user },
  ] = await Promise.all([fetchCategories(), fetchProducts(), fetchUser()]);

  return (
    <PosDashboard
      categories={categories}
      products={products}
      categoriesError={categoriesError}
      productsError={productsError}
      currentUserId={user?.id ?? null}
    />
  );
}
