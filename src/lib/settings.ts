import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";
import type { Settings } from "./store";

// -----------------------------------------
// Get institute settings
// -----------------------------------------
export const getSettingsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Settings> => {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.id, 1));

    if (!row) {
      throw new Error("Settings not found");
    }

    return {
      instituteName: row.instituteName,
      logo: row.logo,
      address: row.address,
      mobile: row.mobile,
      email: row.email,
    };
  },
);

// -----------------------------------------
// Save / Update institute settings
// -----------------------------------------
export const saveSettingsFn = createServerFn({ method: "POST" })
  .validator((input: Settings) => input)
  .handler(async ({ data: input }) => {
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.id, 1));

    if (existing) {
      await db
        .update(settings)
        .set({
          instituteName: input.instituteName,
          logo: input.logo,
          address: input.address,
          mobile: input.mobile,
          email: input.email,
        })
        .where(eq(settings.id, 1));
    } else {
      await db.insert(settings).values({
        id: 1,
        instituteName: input.instituteName,
        logo: input.logo,
        address: input.address,
        mobile: input.mobile,
        email: input.email,
      });
    }

    return input;
  });
