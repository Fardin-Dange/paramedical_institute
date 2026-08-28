import { pgTable, text, numeric, integer } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  course: text("course").notNull(),
  batch: text("batch").notNull(),
  admissionDate: text("admission_date").notNull(),
  instalmentDate: text("instalment_date"),
  totalFee: numeric("total_fee").notNull(),
  paidFee: numeric("paid_fee").notNull().default("0"),
  nextDueDate: text("next_due_date"),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  receiptNo: text("receipt_no").notNull(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  date: text("date").notNull(),
  mode: text("mode").notNull(),
  upiReference: text("upi_reference"),
  nextDueDate: text("next_due_date"),
  remainingAfter: numeric("remaining_after").notNull(),
  previouslyPaid: numeric("previously_paid").notNull(),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  amount: numeric("amount").notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  note: text("note"),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  instituteName: text("institute_name").notNull(),
  logo: text("logo").notNull(),
  address: text("address").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email").notNull(),
});