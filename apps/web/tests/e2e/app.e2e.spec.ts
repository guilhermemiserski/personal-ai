import { expect, test } from "@playwright/test";

const unique = Date.now();
const email = `athlete-${unique}@example.com`;
const password = "SenhaSegura123!";

test("fluxo ponta a ponta onboarding -> treino -> progresso -> coach", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-submit").click();

  await expect(page.getByText("Dados pessoais")).toBeVisible();
  await page.getByLabel("Idade").fill("29");
  await page.getByLabel("Altura (cm)").fill("175");
  await page.getByLabel("Peso (kg)").fill("78");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: "Iniciante (0–6 meses)" }).click();
  await page.getByRole("button", { name: "Ganho muscular" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Academia completa" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByTestId("onboarding-generate-plan").click();

  await expect(page).toHaveURL(/dashboard/, { timeout: 90000 });
  await expect(page.getByText("Treino de hoje")).toBeVisible();
  await page.getByRole("link", { name: "Iniciar treino" }).click();

  await expect(page.getByRole("heading", { level: 3, name: "Feedback do treino" })).toBeVisible();
  await page.getByRole("button", { name: "Finalizar treino" }).click();
  await expect(page.getByText("Resumo")).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progresso" })).toBeVisible();
  await page.getByPlaceholder("Ex.: 78.5").fill("77.8");
  await page.getByRole("button", { name: "Salvar" }).click();

  await page.goto("/coach");
  await page.getByPlaceholder("Ex.: meu ombro dói no supino, como ajustar?").fill("Perdi dois treinos, como ajustar?");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Coach")).toBeVisible();
});
