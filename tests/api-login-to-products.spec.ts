import { test, expect, Page } from "@playwright/test";
import { ApiRequest } from "../src/api/api-request";

test("Signin then add product to cart and proceed to checkout", async ({
  request,
}) => {
  const apiRequest = new ApiRequest(request);
  // Perform login using API
  const loginResponse = await apiRequest.login(
    process.env.USER_EMAIL!,
    process.env.USER_PASSWORD!,
  );
  expect(loginResponse.ok()).toBeTruthy();

  const { access_token } = await loginResponse.json();

  // Get products using API
  const productsResponse = await apiRequest.getProducts(access_token);
  expect(productsResponse.ok()).toBeTruthy();
});
