import { Page, expect } from "@playwright/test";

export class ProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToProductPage() {
    await this.page.goto("/");
  }
  async addProductToCart() {
    await this.page.getByTestId("product-name").first().click();
    await this.page.getByTestId("add-to-cart").click();
    expect(
      await this.page.locator("//div[@role='alert']").textContent(),
    ).toContain(" Product added to shopping cart. ");
  }
}
