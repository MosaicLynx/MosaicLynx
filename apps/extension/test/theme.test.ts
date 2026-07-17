import { describe, expect, it } from "vitest";
import { createAppTheme } from "../src/ui/theme.js";

describe("extension theme", () => {
  it("uses the fintech palette in light mode", () => {
    const theme = createAppTheme("light");
    expect(theme.palette.mode).toBe("light");
    expect(theme.palette.primary.main).toBe("#0f766e");
    expect(theme.palette.background.default).toBe("#f4f7f6");
  });

  it("creates an accessible dark palette without changing the primary intent", () => {
    const theme = createAppTheme("dark");
    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBe("#5eead4");
    expect(theme.palette.background.paper).toBe("#111c19");
  });
});
