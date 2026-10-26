import { Page, expect } from "@playwright/test";

export class NavbarComponent {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async clickOnCart() {
    await this.page.getByTestId("nav-cart").click();
    await expect(this.page).toHaveURL("/checkout");
  }
}
