import { test, expect } from "@playwright/test";
import { ApiRequest } from "../src/api/api-request";
import { LoginPage } from "../src/pages/login-page";
import { FavoritesPage } from "../src/pages/favorites-page";

let accessToken: string | undefined;
let favoriteId: string | undefined;

test.afterEach(async ({ request }) => {
  // Remove the data created by the test. A hook still runs (with working fixtures) when the test times out
  if (accessToken && favoriteId) {
    const deleteResponse = await new ApiRequest(request).deleteFavorite(
      accessToken,
      favoriteId,
    );
    expect(deleteResponse.status()).toBe(204);
  }
  accessToken = undefined;
  favoriteId = undefined;
});

test("Add a favorite through the API then verify it in the UI", async ({
  page,
  request,
}) => {
  const apiRequest = new ApiRequest(request);

  // Login using API
  const loginResponse = await apiRequest.login(
    process.env.USER_EMAIL!,
    process.env.USER_PASSWORD!,
  );
  expect(loginResponse.ok()).toBeTruthy();
  const { access_token } = await loginResponse.json();
  accessToken = access_token;

  // Pick a product using API
  const productsResponse = await apiRequest.getProducts(access_token);
  expect(productsResponse.ok()).toBeTruthy();
  const { id: productId, name: productName } = (await productsResponse.json())
    .data[0];

  // Start clean: remove any existing favorite of this product, otherwise the API rejects the duplicate
  const existingResponse = await apiRequest.getFavorites(access_token);
  expect(existingResponse.ok()).toBeTruthy();
  for (const favorite of await existingResponse.json()) {
    if (favorite.product_id === productId) {
      await apiRequest.deleteFavorite(access_token, favorite.id);
    }
  }

  // Create the data using API
  const addResponse = await apiRequest.addFavorite(access_token, productId);
  expect(addResponse.status()).toBe(201);
  favoriteId = (await addResponse.json()).id;

  // Verify the same data in the UI
  const loginPage = new LoginPage(page);
  const favoritesPage = new FavoritesPage(page);
  await loginPage.navigateToLoginPage();
  await loginPage.login(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
  await favoritesPage.navigateToFavoritesPage();
  await favoritesPage.validateFavorite(favoriteId!, productName);
});
