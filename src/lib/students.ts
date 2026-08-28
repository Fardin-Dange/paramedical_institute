import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { students, payments } from "./db/schema";
import type { Student } from "./store";

// -----------------------------------------
// Get all students
// -----------------------------------------
export const getStudentsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Student[]> => {
    const rows = await db.select().from(students);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      mobile: r.mobile,
      email: r.email ?? "",
      course: r.course,
      batch: r.batch,
      admissionDate: r.admissionDate,
      instalmentDate: r.instalmentDate ?? "",
      totalFee: Number(r.totalFee),
      paidFee: Number(r.paidFee),
      nextDueDate: r.nextDueDate ?? "",
    }));
  },
);

// -----------------------------------------
// Save (add or update) a student
// -----------------------------------------
export const saveStudentFn = createServerFn({ method: "POST" })
  .validator((student: Student) => student)
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(students)
      .where(eq(students.id, data.id));

    const record = {
      id: data.id,
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      course: data.course,
      batch: data.batch,
      admissionDate: data.admissionDate,
      instalmentDate: data.instalmentDate || null,
      totalFee: String(data.totalFee),
      paidFee: String(data.paidFee),
      nextDueDate: data.nextDueDate || null,
    };

    if (existing.length > 0) {
      await db.update(students).set(record).where(eq(students.id, data.id));
    } else {
      await db.insert(students).values(record);
    }

    return data;
  });

// -----------------------------------------
// Delete a student (and their payments)
// -----------------------------------------
export const deleteStudentFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(payments).where(eq(payments.studentId, id));
    await db.delete(students).where(eq(students.id, id));
  });       