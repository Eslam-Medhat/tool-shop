import { Page, expect } from "@playwright/test";

export class FavoritesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToFavoritesPage() {
    await this.page.goto("/account/favorites");
    try {
      // The public site can be slow, especially from CI, so allow more than the default 5s
      await expect(this.page.getByTestId("page-title")).toHaveText(
        "Favorites",
        { timeout: 15_000 },
      );
    } catch (error) {
      // CI keeps no traces or screenshots (public repo), so put what the page showed in the error
      const text = (await this.page.locator("body").innerText()).slice(0, 500);
      throw new Error(
        `Favorites page did not load. URL: ${this.page.url()}\nPage text: ${text}`,
        { cause: error },
      );
    }
  }

  async validateFavorite(favoriteId: string, productName: string) {
    const favorite = this.page.getByTestId(`favorite-${favoriteId}`);
    await expect(favorite).toBeVisible();
    await expect(favorite.getByTestId("product-name")).toHaveText(productName);
  }
}
