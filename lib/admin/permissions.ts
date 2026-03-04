export type Role = "super-admin" | "admin" | "editor";

export type TableName =
  | "categories"
  | "products"
  | "orders"
  | "order_items"
  | "user_roles";

export type Action = "read" | "create" | "update" | "delete" | "export";

const roleRank: Record<Role, number> = {
  "super-admin": 3,
  admin: 2,
  editor: 1,
};

const tableRoleRequirements: Record<TableName, Record<Action, Role>> = {
  categories: {
    read: "editor",
    create: "admin",
    update: "admin",
    delete: "admin",
    export: "editor",
  },
  products: {
    read: "editor",
    create: "admin",
    update: "admin",
    delete: "admin",
    export: "editor",
  },
  orders: {
    read: "editor",
    create: "admin",
    update: "admin",
    delete: "admin",
    export: "editor",
  },
  order_items: {
    read: "editor",
    create: "admin",
    update: "admin",
    delete: "admin",
    export: "editor",
  },
  user_roles: {
    read: "admin",
    create: "super-admin",
    update: "super-admin",
    delete: "super-admin",
    export: "admin",
  },
};

export function isRoleAllowed(role: Role, required: Role) {
  return roleRank[role] >= roleRank[required];
}

export function can(role: Role, table: TableName, action: Action) {
  const required = tableRoleRequirements[table][action];
  return isRoleAllowed(role, required);
}
