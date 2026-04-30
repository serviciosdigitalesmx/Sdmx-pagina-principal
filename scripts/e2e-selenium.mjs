import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const frontendUrl = process.env.E2E_FRONTEND_URL || "https://servicios-digitales-mx-frontend-web.vercel.app";
const apiBaseUrl = process.env.E2E_API_BASE_URL || "https://sdmx-backend-api.onrender.com";
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const folio = process.env.E2E_FOLIO || "";

function assertEnv(name, value) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
}

assertEnv("E2E_EMAIL", email);
assertEnv("E2E_PASSWORD", password);

const options = new chrome.Options();
options.addArguments(
  "--start-maximized",
  "--disable-infobars",
  "--no-sandbox",
  "--disable-dev-shm-usage"
);

const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

try {
  console.log(`[e2e] frontend=${frontendUrl}`);
  console.log(`[e2e] api=${apiBaseUrl}`);

  await driver.get(`${frontendUrl}/login`);
  await driver.wait(until.elementLocated(By.css("input[type='email']")), 15000);

  await driver.findElement(By.css("input[type='email']")).clear();
  await driver.findElement(By.css("input[type='email']")).sendKeys(email);
  await driver.findElement(By.css("input[type='password']")).clear();
  await driver.findElement(By.css("input[type='password']")).sendKeys(password);
  await driver.findElement(By.css("button[type='submit']")).click();

  await driver.wait(until.urlContains("/dashboard"), 20000);
  console.log(`[e2e] logged in -> ${await driver.getCurrentUrl()}`);

  await driver.get(`${frontendUrl}/dashboard/orders/new`);
  await driver.wait(until.elementLocated(By.css("select")), 15000);

  const customerSelect = await driver.findElements(By.css("select")).then((els) => els[0]);
  const templateSelect = await driver.findElements(By.css("select")).then((els) => els[1]);
  const inputs = await driver.findElements(By.css("input"));
  const textareas = await driver.findElements(By.css("textarea"));

  if (!customerSelect || !templateSelect || inputs.length < 5 || textareas.length < 1) {
    throw new Error("New order form structure not found");
  }

  await customerSelect.click();
  await driver.actions().sendKeys("\ue015").perform();
  await driver.actions().sendKeys("\ue007").perform();

  await inputs[0].sendKeys("XYZ-123");
  await inputs[1].sendKeys("Equipo de prueba");
  await inputs[2].sendKeys("Marca prueba");
  await inputs[3].sendKeys("Modelo prueba");
  await inputs[4].sendKeys("Cargador, batería");
  await textareas[0].sendKeys("Pantalla negra, no enciende");

  await templateSelect.click();
  await driver.actions().sendKeys("\ue015").perform();
  await driver.actions().sendKeys("\ue007").perform();

  await driver.findElement(By.css("button[type='submit']")).click();
  await driver.wait(until.urlContains("/dashboard/orders/"), 20000);
  const detailUrl = await driver.getCurrentUrl();
  console.log(`[e2e] order detail -> ${detailUrl}`);

  await driver.wait(until.elementLocated(By.css("h3")), 15000);
  const pageText = await driver.findElement(By.css("main")).getText();
  if (!pageText.includes("Checklist de ingreso")) {
    throw new Error("Checklist section not rendered on order detail");
  }

  const checkbox = await driver.findElement(By.css("input[type='checkbox']"));
  await checkbox.click();

  const saveButton = await driver.findElement(By.xpath("//button[contains(normalize-space(.), 'Guardar cambios')]"));
  if (!saveButton) {
    throw new Error("Save button not found");
  }
  await saveButton.click();
  await driver.wait(until.elementLocated(By.css("main")), 15000);

  await driver.get(`${frontendUrl}/consultar?folio=${detailUrl.split("/").pop()}`);
  await driver.wait(until.elementLocated(By.css("main")), 15000);
  const publicText = await driver.findElement(By.css("main")).getText();
  if (!publicText.includes("Seguimiento de reparación")) {
    throw new Error("Public portal did not load");
  }

  console.log("[e2e] public portal loaded");
  console.log("[e2e] finished ok");
} catch (error) {
  console.error("[e2e] failed:", error);
  process.exitCode = 1;
} finally {
  await driver.quit();
}
