# Supabase SSR Standard

## Goals
- All data fetching happens on the server using Supabase SSR clients.
- Client components only manage UI state and trigger server actions.
- Every page uses typed, reusable server-side query utilities.
- Errors and loading states are handled at the route and section level.

## Required Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

## Server-Side Client Pattern
Use the shared server client for all data access:

```
import { createClient } from "@/lib/supabase/server";

export async function loadSomething() {
  const supabase = await createClient();
  return await supabase.from("table").select("*");
}
```

## Reusable Query Utilities
Centralize reads in `lib/supabase/queries.ts`:

```
import { fetchCategories, fetchProducts } from "@/lib/supabase/queries";

export default async function Page() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
  ]);
  return <PageView categories={categories} products={products} />;
}
```

## Server Actions for Mutations
All mutations and auth flows use server actions from `lib/supabase/actions.ts`:

```
"use client";

import { useFormState } from "react-dom";
import { loginAction } from "@/lib/supabase/actions";

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, { error: null });
  return <form action={formAction}>{state.error}</form>;
}
```

## Error and Loading States
- Use `app/loading.tsx` for route-level loading skeletons.
- Use `app/error.tsx` for global error boundaries.
- For section-level errors, render inline banners and provide a retry via `router.refresh()`.

## Type Safety
- Use `Tables<"table_name">` from `database.types.ts`.
- Keep query results typed in `lib/supabase/queries.ts`.

## Component Boundaries
- Server Components fetch and pass data as props.
- Client Components manage UI state, form input, and optimistic UI.
- No direct Supabase client usage in Client Components.
