"use server";

import type { TablesInsert } from "@/database.types";
import { createClient } from "@/lib/supabase/server";

type CheckoutItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

type SubmitOrderInput = {
  paymentMethod: "credit" | "cash" | "e-wallet";
  items: CheckoutItemInput[];
  totalAmount: number;
};

type SubmitOrderResult = {
  data: { orderId: string } | null;
  error: string | null;
};

export async function submitOrderAction(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { data: null, error: "Your cart is empty" };
  }

  const invalidItem = input.items.find(
    (item) =>
      !item.productId ||
      !Number.isFinite(item.quantity) ||
      item.quantity < 1 ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0
  );
  if (invalidItem) {
    return { data: null, error: "Invalid cart data. Please refresh and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, stock_quantity")
    .in("id", productIds);

  if (productsError) {
    return { data: null, error: productsError.message };
  }

  const stockById = new Map((products ?? []).map((product) => [product.id, product.stock_quantity]));
  const unavailable = input.items.find((item) => {
    const stock = stockById.get(item.productId);
    return stock === undefined || stock < item.quantity;
  });
  if (unavailable) {
    return { data: null, error: "Some items are out of stock. Please review your cart." };
  }

  const orderPayload: TablesInsert<"orders"> = {
    customer_id: user?.id ?? null,
    payment_method: input.paymentMethod,
    status: "completed",
    total_amount: input.totalAmount,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("id")
    .single();
  if (orderError || !order) {
    return { data: null, error: orderError?.message ?? "Unable to create order" };
  }

  const orderItemsPayload: TablesInsert<"order_items">[] = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));
  const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { data: null, error: itemsError.message };
  }

  for (const item of input.items) {
    const availableStock = stockById.get(item.productId);
    if (availableStock === undefined) continue;
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: Math.max(0, availableStock - item.quantity) })
      .eq("id", item.productId);
    if (updateError) {
      return { data: { orderId: order.id }, error: null };
    }
  }

  return { data: { orderId: order.id }, error: null };
}
