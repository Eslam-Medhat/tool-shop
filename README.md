# Tool Shop – Playwright Test Automation

End-to-end (UI) and API tests for the [Practice Software Testing – Toolshop](https://practicesoftwaretesting.com/) demo application, written with [Playwright](https://playwright.dev/) and TypeScript.

The project uses the **Page Object Model** for UI interactions and a small **API client** wrapper for REST calls, so a single test can mix both (for example: create data through the API, then verify it in the UI).

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Running the tests](#running-the-tests)
- [Running against a local copy of the app](#running-against-a-local-copy-of-the-app)
- [Continuous integration](#continuous-integration)
- [Test suite](#test-suite)
- [Architecture](#architecture)
- [Writing a new test](#writing-a-new-test)
- [API reference (endpoints used)](#api-reference-endpoints-used)
- [Known limitations](#known-limitations)

## Tech stack

| Tool | Purpose |
| --- | --- |
| [Playwright Test](https://playwright.dev/docs/intro) (`@playwright/test`) | Test runner, browser automation, API testing |
| TypeScript | Language |
| [dotenv](https://github.com/motdotla/dotenv) | Loads credentials and the base URL from `.env` |

Tests run on **Chromium** (Desktop Chrome) only. Locally the HTML reporter is used; CI writes results to the job log instead (see [Continuous integration](#continuous-integration)).

## Project structure

```
tool-shop/
├── .github/workflows/
│   └── playwright.yml            # CI: runs the suite on GitHub Actions
├── docker/
│   ├── docker-compose.yml        # Local copy of the Toolshop app (UI :4200, API :8091)
│   └── start-app.sh              # Starts it, seeds the database, waits until it is ready
├── playwright.config.ts          # Runner config (testDir, baseURL, test-id attribute, reporter)
├── tsconfig.json
├── package.json
├── .env.example                  # Template for .env
├── .env                          # Local secrets/config (git-ignored, create it yourself)
├── src/
│   ├── api/
│   │   └── api-request.ts        # ApiRequest: wrapper around the REST API
│   └── pages/                    # Page objects
│       ├── login-page.ts
│       ├── product-page.ts
│       ├── navbar-component.ts
│       ├── checkout-page.ts
│       └── favorites-page.ts
└── tests/
    ├── login-to-checkout.spec.ts       # UI: sign in -> add to cart -> checkout -> pay
    ├── api-login-to-products.spec.ts   # API: login -> list products
    └── api-favorite-to-ui.spec.ts      # Hybrid: create favorite via API -> verify in UI
```

## Getting started

### Prerequisites

- Node.js (a current LTS release) and npm
- A registered account on the Toolshop site (the tests sign in with it)

### Install

```bash
npm install
npx playwright install chromium
```

## Configuration

Copy `.env.example` to `.env` in the project root and fill in the values (`.env` is git-ignored, never commit it):

```dotenv
BASE_URL=https://practicesoftwaretesting.com
USER_EMAIL=<your account email>
USER_PASSWORD=<your account password>
```

| Variable | Used for |
| --- | --- |
| `BASE_URL` | Playwright `baseURL`; UI tests call `page.goto("/...")` with relative paths |
| `USER_EMAIL` | Login for both UI and API tests |
| `USER_PASSWORD` | Login for both UI and API tests |
| `API_URL` | Optional. API of the app `BASE_URL` points to; empty means the public API. Set it together with `BASE_URL` when using another copy of the app, otherwise the API calls still go to the public site |

Other settings live in [playwright.config.ts](playwright.config.ts):

- `testIdAttribute: "data-test"`: `page.getByTestId("x")` targets `data-test="x"`, which is the attribute the Toolshop app uses.
- `fullyParallel: true`: tests run in parallel; on CI (`CI` env var set) there is 1 worker, 2 retries and `forbidOnly` is on.
- `trace: "on-first-retry"`: traces are captured when a test is retried.

`API_URL` is the API base URL used by `ApiRequest`. When empty or unset it defaults to `https://api.practicesoftwaretesting.com`, so set it together with `BASE_URL` when you point the tests at another copy of the app (see [Running against a local copy of the app](#running-against-a-local-copy-of-the-app)).

## Running the tests

`package.json` has no npm scripts yet, so use `npx playwright` directly:

```bash
# everything
npx playwright test

# a single file
npx playwright test tests/api-favorite-to-ui.spec.ts

# a single test by title
npx playwright test -g "Add a favorite"

# see the browser
npx playwright test --headed

# step through with the Playwright inspector
npx playwright test --debug

# interactive UI mode
npx playwright test --ui

# open the last HTML report
npx playwright show-report
```

Test output goes to `test-results/` and `playwright-report/` (both git-ignored).

## Running against a local copy of the app

The public site sits behind a Cloudflare bot check that blocks GitHub's runners, so CI (and you, if you like) can run the tests against a local copy of the app instead. It needs Docker and free ports `4200` and `8091`.

```bash
./docker/start-app.sh      # starts the app, seeds the database, waits until it is ready

BASE_URL=http://localhost:4200 \
API_URL=http://localhost:8091 \
USER_EMAIL=customer@practicesoftwaretesting.com \
USER_PASSWORD=welcome01 \
npx playwright test

docker compose -f docker/docker-compose.yml down -v   # stop it and drop the data
```

`customer@practicesoftwaretesting.com` / `welcome01` is one of the public demo accounts seeded by the app (see its [docs](https://testsmith-io.github.io/practice-software-testing/)). Running `start-app.sh` again resets the database.

How it works:

- [docker/docker-compose.yml](docker/docker-compose.yml) runs the project's prebuilt sprint 5 API and UI images (pinned to version `2.5`) plus MariaDB.
- The project's published `web` image is ARM-only, so it uses stock `nginx` with the project's `vhost.conf`. The script downloads that file at start-up (pinned to a commit) into `docker/nginx/`, which is git-ignored. It is not committed here because the project's license allows running its software but not publishing copies of it.
- The images are pinned by digest in the compose file. To update them, pull the new tag and replace the digest with the output of `docker image inspect <image> --format '{{index .RepoDigests 0}}'`.
- Start it with `start-app.sh`, not a bare `docker compose up`: compose refuses to start `web` until the nginx config has been downloaded.
- The first start downloads about 450 MB of images; later starts take seconds.

## Continuous integration

[.github/workflows/playwright.yml](.github/workflows/playwright.yml) runs the whole suite on GitHub Actions (Chromium, Node 24) against a local copy of the app started by `docker/start-app.sh`.

**When it runs:** on pushes and pull requests to `master` / `main`, and manually from the Actions tab (*Run workflow*).

**No secrets needed:** the workflow uses the public demo account above, and every run starts with a freshly seeded database. That is also why pull requests from forks run normally, and why parallel runs cannot collide on shared data.

**How it behaves:**

- GitHub sets `CI=true`, so the config switches to 1 worker, 2 retries and `forbidOnly`.
- A new push to a pull request cancels that PR's outdated run. Pushes to `master` / `main` are never cancelled, so every merged commit is tested.
- Steps have their own timeouts (12 min to start the app, 10 min for the tests), so a stuck app fails fast with its logs.
- The token only has `contents: read`.
- The HTML report (with traces for retried tests) is uploaded as the `playwright-report` artifact for 14 days. If a run fails, the last 100 lines of the app logs are printed.
- **Do not upload the report if you switch CI to real credentials.** Reports and traces can contain typed values such as passwords, and artifacts of a public repo are downloadable by any GitHub user. It is only safe here because the demo account is public.

## Test suite

### 1. `login-to-checkout.spec.ts`: UI end-to-end

Signs in through the login form, opens the first product from the home page, adds it to the cart, goes through the checkout steps (billing address, credit card payment) and asserts the "Payment was successful" message.

Page objects used: `LoginPage`, `ProductPage`, `NavbarComponent`, `CheckoutPageage`.

### 2. `api-login-to-products.spec.ts`: API

Logs in via `POST /users/login`, takes the bearer token, and calls `GET /products`. It currently asserts only that both responses are OK and logs the products payload.

### 3. `api-favorite-to-ui.spec.ts`: hybrid API + UI

Creates data through the API and verifies it in the UI.

1. Log in via the API and get a token.
2. Pick the first product via `GET /products`.
3. Remove any existing favorite of that product (the API rejects duplicates with `409`).
4. `POST /favorites`, which must return `201` and the new favorite's `id`.
5. Log in through the UI and open `/account/favorites`.
6. Assert the element `favorite-<id>` is visible and shows the product name.
7. In a `finally` block, `DELETE /favorites/<id>` (expects `204`) so the test leaves the account clean even when the UI check fails.

## Architecture

### API client: `ApiRequest`

[src/api/api-request.ts](src/api/api-request.ts) wraps Playwright's `APIRequestContext` (the `request` fixture). Methods:

| Method | Endpoint |
| --- | --- |
| `login(email, password)` | `POST /users/login` |
| `getProducts(token)` | `GET /products` |
| `getProduct(productId)` | `GET /products/{id}` |
| `getFavorites(token)` | `GET /favorites` |
| `addFavorite(token, productId)` | `POST /favorites` |
| `deleteFavorite(token, favoriteId)` | `DELETE /favorites/{id}` |

Methods return the raw `APIResponse`, so the test decides what to assert.

### Page objects

Each class takes a `Page` in its constructor and exposes user-level actions and validations. Selectors use `getByTestId` (the `data-test` attribute).

| Class | File | Responsibility |
| --- | --- | --- |
| `LoginPage` | [login-page.ts](src/pages/login-page.ts) | Open `/auth/login`, sign in, assert redirect to `/account` |
| `ProductPage` | [product-page.ts](src/pages/product-page.ts) | Open the home page, add the first product to the cart |
| `NavbarComponent` | [navbar-component.ts](src/pages/navbar-component.ts) | Click the cart icon, assert `/checkout` |
| `CheckoutPageage` | [checkout-page.ts](src/pages/checkout-page.ts) | Cart check, billing address, payment details, order confirmation |
| `FavoritesPage` | [favorites-page.ts](src/pages/favorites-page.ts) | Open `/account/favorites`, assert a favorite is shown |

### Hybrid pattern

Use the API for **fast, reliable setup and cleanup** and the UI only for **what you want to verify visually**. This keeps UI tests short and avoids repeating long click-paths to prepare data.

## Writing a new test

1. Add any new endpoint calls to `ApiRequest`, returning the raw response.
2. Add a page object in `src/pages/` for any new screen. Use `getByTestId` and web-first assertions (`await expect(locator)...`) so Playwright auto-waits and retries.
3. Create `tests/<name>.spec.ts`. Read credentials from `process.env` (never hard-code them).
4. If the test creates data, delete it in a `try/finally` so failed runs do not leave the shared account dirty.

Minimal example:

```ts
import { test, expect } from "@playwright/test";
import { ApiRequest } from "../src/api/api-request";

test("example", async ({ request }) => {
  const api = new ApiRequest(request);
  const res = await api.login(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
  expect(res.ok()).toBeTruthy();
});
```

## API reference (endpoints used)

Base URL: `https://api.practicesoftwaretesting.com`

| Method | Path | Auth | Success | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/users/login` | none | `200` | Body `{ email, password }`; returns `access_token`, `token_type`, `expires_in` (300 s) |
| `GET` | `/products` | none | `200` | Paginated: `{ current_page, data: [...], ... }` |
| `GET` | `/products/{id}` | none | `200` | Single product |
| `GET` | `/favorites` | Bearer | `200` | Array of favorites incl. the nested product |
| `POST` | `/favorites` | Bearer | `201` | Body `{ product_id }`; returns `{ id, user_id, product_id }`; `409` if already favorited |
| `DELETE` | `/favorites/{id}` | Bearer | `204` | |

Other endpoints seen while exploring (not covered by tests yet): `GET /brands`, `GET /categories`, `GET /users/me`, `GET /invoices`, `POST /carts`.

Authenticated calls send `Authorization: Bearer <access_token>`. Tokens expire after 5 minutes, so log in at the start of each test rather than sharing one across a long run.

## Known limitations

- **Shared public site.** Tests run against the public demo, which other people also use. Data and product ordering can change, and the site can be slow or briefly unavailable.
- **Parallel runs on one account can collide.** Two copies of the favorites test running at the same time (for example `--repeat-each` with several workers) both try to favorite the same product, and one gets `409`. A normal single run is fine; use `--workers=1` if you repeat it. CI is not affected, because every run has its own freshly seeded database.
- **First product dependency.** Tests use the first product returned or shown, so they assume at least one product exists.
- **No npm scripts** yet.
- **Public site vs local copy:** against the public site (`.env` defaults) the tests share one account with other users and can hit the Cloudflare bot check from datacenter IPs. CI avoids both by using the local copy. Set `BASE_URL` and `API_URL` together when switching.
- **Local copy needs Docker** and pulls third-party images from Docker Hub; the pinned version (`2.5`) may need bumping when the public site changes.
- **Naming:** the checkout page object class is spelled `CheckoutPageage` (typo); renaming it needs updates in `checkout-page.ts` and `login-to-checkout.spec.ts`.
