import { describe, it, expect } from "vitest";
import { ratioContraste, melanger } from "./contrast";
import { PALETTE } from "@/lib/design/tokens";

describe("contraste de la palette", () => {
  it("le texte principal atteint le niveau AAA", () => {
    expect(ratioContraste(PALETTE.textePrincipal, PALETTE.fond)).toBeGreaterThanOrEqual(7);
  });

  it("le texte secondaire atteint le niveau AA", () => {
    expect(ratioContraste(PALETTE.texteSecondaire, PALETTE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("l accent atteint le niveau AA", () => {
    expect(ratioContraste(PALETTE.accent, PALETTE.fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("le texte reste conforme AA a 40% d assombrissement", () => {
    const texte = melanger(PALETTE.textePrincipal, PALETTE.ombre, 0.4);
    const fond = melanger(PALETTE.fond, PALETTE.ombre, 0.4);
    expect(ratioContraste(texte, fond)).toBeGreaterThanOrEqual(4.5);
  });

  it("le ratio d une couleur avec elle-meme vaut 1", () => {
    expect(ratioContraste("#131518", "#131518")).toBeCloseTo(1, 5);
  });

  it("le ratio noir sur blanc vaut 21", () => {
    expect(ratioContraste("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
});
