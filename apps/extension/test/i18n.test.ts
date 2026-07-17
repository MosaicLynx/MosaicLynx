import { afterEach, describe, expect, it } from "vitest";
import i18n from "../src/popup/i18n.js";

describe("popup localization", () => {
  afterEach(async () => { await i18n.changeLanguage("en"); });

  it("switches between bundled English and Japanese resources", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("addAccount")).toBe("Add account");

    await i18n.changeLanguage("ja");
    expect(i18n.t("addAccount")).toBe("アカウントを追加");
    expect(i18n.t("theme")).toBe("テーマ");
    expect(i18n.t("darkTheme")).toBe("ダークテーマ");
    expect(i18n.t("approvalChainStateUnverifiedTitle")).toBe("チェーン状態は未照合です");
    expect(i18n.t("approvalReject")).toBe("拒否");
  });

  it("includes approval copy in English", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("approvalProfilePassword")).toBe("Profile password");
    expect(i18n.t("approvalChainStateUnverifiedTitle")).toBe("Chain state is not checked");
  });
});
