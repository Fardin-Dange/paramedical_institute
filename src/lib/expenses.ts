import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { expenses } from "./db/schema";
import type { Expense } from "./store";

function toExpense(r: typeof expenses.$inferSelect): Expense {
  return {
    id: r.id,
    title: r.title,
    amount: Number(r.amount),
    date: r.date,
    category: r.category,
    note: r.note ?? "",
  };
}

// -----------------------------------------
// Get all expenses
// -----------------------------------------
export const getExpensesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Expense[]> => {
    const rows = await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.date));

    return rows.map(toExpense);
  },
);

// -----------------------------------------
// Add new expense
// -----------------------------------------
export const addExpenseFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      title: string;
      amount: number;
      date: string;
      category: string;
      note?: string | undefined;
    }) => input,
  )
  .handler(async ({ data: input }) => {
    const expense = {
      id: "E" + Date.now(),
      title: input.title.trim(),
      amount: String(input.amount),
      date: input.date,
      category: input.category,
      note: input.note?.trim() || null,
    };

    await db.insert(expenses).values(expense);

    return toExpense(expense as typeof expenses.$inferSelect);
  });

// -----------------------------------------
// Update existing expense
// -----------------------------------------
export const updateExpenseFn = createServerFn({ method: "POST" })
  .validator((expense: Expense) => expense)
  .handler(async ({ data: input }) => {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, input.id));

    if (!existing) {
      throw new Error("Expense not found");
    }

    await db
      .update(expenses)
      .set({
        title: input.title.trim(),
        amount: String(Number(input.amount) || 0),
        date: input.date,
        category: input.category,
        note: input.note?.trim() || null,
      })
      .where(eq(expenses.id, input.id));

    const [updated] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, input.id));

    if (!updated) {
      throw new Error("Expense update failed");
    }

    return toExpense(updated);
  });

// -----------------------------------------
// Delete expense
// -----------------------------------------
export const deleteExpenseFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!existing) {
      return;
    }

    await db.delete(expenses).where(eq(expenses.id, id));
  });
