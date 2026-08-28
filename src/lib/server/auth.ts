import { createServerFn } from "@tanstack/react-start";

// -----------------------------------------
// Admin Login
// -----------------------------------------
export const loginFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      username: string;
      password: string;
    }) => input,
  )
  .handler(async ({ data: input }) => {
    const username = input.username.trim().toLowerCase();

    if (username === "admin" && input.password === "admin123") {
      return {
        success: true,
      };
    }

    return {
      success: false,
    };
  });