import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { students, payments } from "./db/schema";
import type { Payment } from "./store";

function toPayment(r: typeof payments.$inferSelect): Payment {
  return {
    id: r.id,
    receiptNo: r.receiptNo,
    studentId: r.studentId,
    amount: Number(r.amount),
    date: r.date,
    mode: r.mode as Payment["mode"],
    upiReference: r.upiReference ?? undefined,
    nextDueDate: r.nextDueDate ?? "",
    remainingAfter: Number(r.remainingAfter),
    previouslyPaid: Number(r.previouslyPaid),
  };
}

// -----------------------------------------
// Get all payments
// -----------------------------------------
export const getPaymentsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Payment[]> => {
    const rows = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.date));

    return rows.map(toPayment);
  },
);

// -----------------------------------------
// Add a new payment (and update student's paidFee)
// -----------------------------------------
export const addPaymentFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      studentId: string;
      amount: number;
      date: string;
      mode: Payment["mode"];
      nextDueDate: string;
      upiReference?: string | undefined;
    }) => input,
  )
  .handler(async ({ data: input }) => {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, input.studentId));

    if (!student) throw new Error("Student not found");

    const allPayments = await db.select().from(payments);
    const maxReceipt = allPayments.reduce((max, p) => {
      const n = parseInt(p.receiptNo.replace(/\D/g, ""), 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 1000);
    const receiptNo = "RCP-" + String(maxReceipt + 1);

    const previouslyPaid = Number(student.paidFee);
    const newPaid = previouslyPaid + input.amount;
    const totalFee = Number(student.totalFee);

    const payment = {
      id: "P" + Date.now(),
      receiptNo,
      studentId: student.id,
      amount: String(input.amount),
      date: input.date,
      mode: input.mode,
      upiReference: input.upiReference?.trim() || null,
      nextDueDate: newPaid >= totalFee ? null : input.nextDueDate,
      previouslyPaid: String(previouslyPaid),
      remainingAfter: String(Math.max(0, totalFee - newPaid)),
    };

    await db.insert(payments).values(payment);

    await db
      .update(students)
      .set({
        paidFee: String(newPaid),
        nextDueDate: newPaid >= totalFee ? null : input.nextDueDate,
      })
      .where(eq(students.id, student.id));

    return toPayment(payment as typeof payments.$inferSelect);
  });

// -----------------------------------------
// Recalculate a student's paidFee from scratch
// (used after editing/deleting a payment)
// -----------------------------------------
async function recalculateStudentPayments(studentId: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId));
  if (!student) return;

  const related = (
    await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId))
  ).sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date),
  );

  const totalFee = Number(student.totalFee);
  let paid = 0;

  for (const p of related) {
    await db
      .update(payments)
      .set({
        previouslyPaid: String(paid),
        remainingAfter: String(
          Math.max(0, totalFee - (paid + Number(p.amount))),
        ),
      })
      .where(eq(payments.id, p.id));

    paid += Number(p.amount) || 0;
  }

  const latest = related[related.length - 1];

  await db
    .update(students)
    .set({
      paidFee: String(paid),
      nextDueDate: paid >= totalFee ? null : latest?.nextDueDate || null,
    })
    .where(eq(students.id, studentId));
}

// -----------------------------------------
// Update an existing payment
// -----------------------------------------
export const updatePaymentFn = createServerFn({ method: "POST" })
  .validator((payment: Payment) => payment)
  .handler(async ({ data: input }) => {
    const [existing] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, input.id));

    if (!existing) throw new Error("Payment not found");
    const oldStudentId = existing.studentId;

    await db
      .update(payments)
      .set({
        studentId: input.studentId,
        amount: String(Number(input.amount) || 0),
        date: input.date,
        mode: input.mode,
        upiReference: input.upiReference?.trim() || null,
        nextDueDate: input.nextDueDate || null,
      })
      .where(eq(payments.id, input.id));

    await recalculateStudentPayments(oldStudentId);
    if (input.studentId !== oldStudentId) {
      await recalculateStudentPayments(input.studentId);
    }

    const [updated] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, input.id));
    if (!updated) throw new Error("Payment update failed");

    return toPayment(updated);
  });

// -----------------------------------------
// Delete a payment
// -----------------------------------------
export const deletePaymentFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    if (!payment) return;

    await db.delete(payments).where(eq(payments.id, id));
    await recalculateStudentPayments(payment.studentId);
  });
