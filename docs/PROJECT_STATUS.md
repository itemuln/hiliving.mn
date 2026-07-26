# Project Status

## Current project state

HiLiving is a modular monorepo with an independently buildable React/Vite storefront in `frontend/` and a Java 21 Spring Boot API in `backend/`. QPay Merchant V2 checkout, customer order history, administration order management, and the earlier transactional-email/account recovery work now extend the commerce foundation. Environment-only test merchant credentials have successfully created a real QPay invoice with a QR image and 22 bank deeplinks. Failed QPay initiation now atomically cancels the order and restores its inventory exactly once, while application-owned expiry gives new invoices a 15-minute payment window by default. Production activation still requires owner-controlled credentials, a stable public HTTPS callback origin, and real paid/expiry rehearsals.

## Features currently working

- Responsive React/Vite storefront with preserved home, category, brand, product, and news routes
- Minimal responsive `/contact` page with direct phone, email, office-hours, address, and external map actions
- Five-item mobile bottom navigation with a compact keyboard-safe text menu and one unambiguous active state
- Environment-based catalog API configuration with same-origin defaults
- Typed backend DTO definitions, explicit frontend-domain mapping, centralized fetch/status handling, cancellation, and safe normalized errors
- Backend-driven home categories, brands, and featured products
- Backend-driven category and brand pages with URL-based search, controlled sorting, server pagination, a persistent shared hero, home-style reveal motion, and icon-triggered mobile category switching
- Complete slug-based product detail with ordered gallery images, SKU, membership-aware pricing, bounded quantities, stock state, add-to-cart, and related products
- Loading skeletons plus successful, empty, safe error, retry, 400, 404, and backend-unavailable states
- API-backed active hero banners and published news list/detail content
- Frontend Vitest and Testing Library coverage at the HTTP boundary
- Frontend clean install, ESLint, tests, TypeScript compilation, and production Vite build
- Customer registration followed by explicit login; public registration never grants `ADMIN`
- Server-side Spring Security sessions with an HttpOnly `JSESSIONID`, `SameSite=Lax`, session fixation protection, and no browser-stored auth token
- Cookie-to-header CSRF protection through `XSRF-TOKEN` and `X-XSRF-TOKEN`
- Auth hydration through `/api/v1/account/me`, protected account routes, safe internal `returnTo`, session-expiry handling, and responsive auth/account header states
- Customer profile and password updates plus ownership-scoped delivery-address CRUD and transactional default switching
- Compact account overview with profile editing, inline verified-email state, and unverified-email actions combined in registration information
- Permanent `REGULAR`, `BRONZE`, `SILVER`, and `GOLD` tiers with default, override, and effective discount display
- Responsive Mongolian-language admin shell, dashboard counts, catalog CRUD, managed image upload, inventory, orders, users, banners, and news
- Permanent membership tiers with admin-only assignment, nullable override management, account status control, and address viewing
- Product lifecycle, operational visibility flag labeled `Visible` in administration, computed inventory state, six-image limit, and membership-discount eligibility controls
- Reusable safe admin audit logging for catalog, price, inventory, membership, status, banner, and news changes
- JPEG/PNG decode-and-reencode processing with purpose-specific limits, safe UUID keys, external filesystem storage, and public read-only `/media/**` delivery
- Reusable upload controls with picker, drag/drop, progress, preview, replacement, removal, retry, and save blocking while uploads are pending
- Product administration supports selecting up to six photos in one file-picker action and renders cards only for selected photos while retaining per-image replacement, primary selection, ordering, and removal
- Banner administration supports a two-photo batch where the first image is desktop and the second is mobile; upload URLs are automatic and unused destination/link-label inputs are hidden
- News uses automatic publication-date ordering, brands use automatic alphabetical ordering, and category administration omits parent/children controls
- Admin numeric inputs normalize leading zeros, preserve native step controls, clamp configured bounds on blur, and keep nullable values empty; product discounts are opt-in and can be entered as either a percentage or final discounted price with live conversion
- Versioned browser cart persistence containing only product slugs and quantities, with duplicate merging, malformed-data recovery, live item counts, and server reconciliation
- Public backend-authoritative cart quotation in MNT, including catalog discounts, eligible customer membership discounts, selected delivery method, stock validation, and final totals
- Protected checkout with safe post-login return, standard-delivery address selection/creation, zero-fee self-pickup with a clearly marked sample collection location, QPay QR/deeplink generation, submission locking, and failure-safe cart retention
- Transactional order creation with immutable item/address/pricing snapshots, row-locked inventory deduction, per-customer idempotency keys, payment expiry stock restoration, and ownership-scoped order access
- QPay Merchant V2 token/invoice/check client, durable payment attempts/deeplinks, unguessable callback URLs, server-side amount/currency verification, exact-once order confirmation email, and late-payment reconciliation state
- Customer order list/detail/payment routes plus ADMIN order list/search/filter/detail and validated fulfillment transitions
- PostgreSQL email outbox with idempotent event keys, concurrent claiming, processing leases, bounded retry, safe failures, and SMTP delivery disabled by default
- Hashed, expiring, single-use, purpose-specific verification/reset tokens, protected token-bearing outbox data, and bounded rate limits
- `/forgot-password`, `/reset-password`, and `/verify-email` routes plus authenticated verification status/resend controls
- Password-reset session-version invalidation and immutable order email contact snapshots
- Spring Boot 4.1.0 catalog API compiled and tested on Temurin Java 21
- PostgreSQL 17, Flyway through version 12, Hibernate schema validation, and Testcontainers integration coverage
- GitHub Actions and Jenkins frontend test stages

## Current active task

No implementation task is active. The failed-QPay-initiation inventory blocker is resolved, its five historical local test orders are repaired, and application-owned QPay expiry prevents merchant-configured immediate expiry. The next P1 verification is one real paid callback/check and one real application-managed provider cancellation/expiry, followed by stable staging HTTPS.

## Latest meaningful changes

- 2026-07-26: Removed the account overview's order-history shortcut, added `Мэдээлэл засах` navigation to Personal Information, reduced the membership card's width/padding/type scale, and replaced the verified-email status block with a small green check beside the email address. Unverified accounts retain their inline resend guidance. All 87 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Combined email-verification status and resend behavior with email/phone inside the account overview's registration-information panel, leaving membership and registration details as its two primary cards. Removed the redundant `Шууд холбогдох` heading from the self-explanatory contact actions. All 86 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Expanded the mobile bottom navigation with a fifth `Цэс` action that opens a minimal, title-free, arrow-free, focus-contained text sheet for Hiliving MGL, brands, news, and contact while keeping `Ангилал` product-only. The sheet closes through its trigger, backdrop, or Escape without a separate X, and suppresses the underlying route highlight while open so only one action appears selected. Added correct secondary-route active states and made the existing Hiliving MGL hash target functional. All 85 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Added a lazy-loaded responsive `/contact` page, changed the primary contact navigation from a home-page footer anchor to the real route, exposed click-to-call/email and external directions actions, and linked the page from the shared footer. Its final presentation uses plain white surfaces, restrained type, and dividers without gradients, decorative effects, or repeated calls to action. All 82 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Simplified delivery-address entry by removing customer-facing nickname and recipient-name controls, adding dependent Ulaanbaatar district/khoroo dropdowns plus entrance/apartment inputs, showing phone-only address cards, and stripping postal/Mongolia suffixes from reverse-geocoded fallback text. Backend address and order-snapshot contracts remain unchanged. All 81 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Added a lazy-loaded Leaflet delivery-address picker centered on Ulaanbaatar, with explicit OpenStreetMap attribution and one customer-confirmed Mongolian-preferred reverse lookup into the existing editable address fields. The integration requires no Google key or backend schema change and keeps tile/geocoder endpoints configurable. All 77 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Added a clearly separated `Нүүр хуудас руу буцах` action to the responsive administration sidebar so administrators can return directly to the storefront from desktop or mobile navigation. All 74 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Translated the complete administration workspace to Mongolian, refreshed its shared visual system, added keyboard-safe dialogs and deletion confirmation, centralized status/date/money/pagination/search presentation, guarded debounced lists against stale responses, fixed interrupted-upload pending state, and parallelized ordered batch uploads. All 74 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Disabled QPay's merchant-configured auto-expiry for new invoices and made the existing `QPAY_INVOICE_TTL` application deadline authoritative. The scheduler still cancels the provider invoice before releasing stock; all 65 backend tests and JAR packaging pass.
- 2026-07-26: Kept the current hero banner in per-tab session state, restored it immediately across reloads and storefront route remounts, limited its fade/scale entrance to once per tab session, and eagerly loaded the visible slide. All 74 frontend tests, lint, TypeScript, and the production build pass.
- 2026-07-26: Added backend-authoritative `SELF_PICKUP` checkout with a 0₮ shipping quote, no customer delivery-address requirement, an immutable sample pickup-location snapshot, pickup-aware customer/admin order detail, and direct processing-to-collected fulfillment. All 65 backend tests, 73 frontend tests, frontend lint, TypeScript, and production build pass.
- 2026-07-26: Turned the mobile category icon tile into the accessible category-switching button, removed the separate select, and added a scrollable active-state menu with focus/Escape handling; all 72 frontend tests, lint, TypeScript, production build, and 390×844 browser interaction pass.
- 2026-07-26: Kept the hero carousel mounted across category and brand URL changes, moved internal catalog navigation directly to the product area, and applied the home page's reduced-motion-aware ease-out reveal to catalog content; all 70 frontend tests, lint, TypeScript, production build, and real-browser category-to-brand navigation pass.
- 2026-07-26: Added QPay Merchant V2 QR/deeplink checkout preparation, verified GET callback reconciliation through `payment/check`, durable payment attempts, expiry stock restoration, customer order history, and administration order list/detail/fulfillment views.
- 2026-07-26: Corrected the live Merchant V2 invoice response contract to read bank deeplinks from `urls`, then successfully created a real invoice with a QR image and 22 deeplinks while preserving the actual order amount. Exact MNT payment verification and callback semantics remain backend-authoritative.
- 2026-07-26: Reassessed the full project: all 63 backend tests and packaging passed with Flyway V1-V11 and Hibernate validation; all 65 frontend tests, lint, TypeScript compilation, and the Vite production build passed. The local backend run used JDK 26 with compiler release 21 because this workstation does not currently have a Java 21 runtime; exact Java 21 verification remains required before release.
- 2026-07-26: Made failed QPay authentication/invoice initiation atomically mark the attempt `FAILED`, cancel the order with payment `FAILED`, restore row-locked inventory, and stamp the release exactly once. Explicit provider failures now rotate the browser idempotency key for a safe fresh order, while network-ambiguous responses retain the original key to avoid duplicates. All 64 backend tests, 67 frontend tests, frontend lint, and the production build pass.
- 2026-07-26: Repaired the five historical local failed QPay orders in one guarded transaction, restored seven `skincare` units, recorded audits, and verified zero stranded failed orders. The separate valid awaiting-payment invoice was not changed.
- 2026-07-26: Completed an isolated real-browser checkout rehearsal from registration and address entry through QR/deeplink display, unpaid/paid verification, callback replay, customer history, and ADMIN list/detail. Corrected the checkout's stale cash-on-delivery label and the ADMIN blank-search PostgreSQL query discovered during that rehearsal.
- 2026-07-23: Renamed the product editor's operational `Active` checkbox to `Visible` without changing its stored field or storefront-visibility behavior.
- 2026-07-22: Verified the completed admin input/content cleanup with all 59 backend tests, all 64 frontend tests, frontend lint, TypeScript/Vite production build, real-browser interaction checks, and `git diff --check`.
- 2026-07-22: Removed manual news and brand sort authoring, switched their server ordering to newest-publication and alphabetical rules, removed category parent/children controls, and added dynamic two-photo banner batch upload without unused click-through fields.
- 2026-07-22: Made catalog discounts optional in the product editor. Enabling the discount checkbox reveals percentage/final-price modes, calculates the corresponding value live, and continues submitting only the backend-compatible nullable discounted price.
- 2026-07-22: Standardized numeric input behavior across product, news, banner, category, brand, and user-discount administration; leading zeros are normalized, native increment/decrement remains active, bounds are enforced on blur, and invalid product discounts show an explicit invalid state.
- 2026-07-22: Added dynamic multi-select product photo upload so one Add photos action can populate up to six images without showing empty image cards; the first image remains primary by default.
- 2026-07-22: Corrected product sidebar matching so Add product and All products are not highlighted simultaneously.

- 2026-07-19: Added transactional SMTP email through a durable outbox, verification/password recovery with hashed tokens, reset session invalidation, order notifications/status transitions, recovery UI, tests, and operational documentation.

- 2026-07-18: Removed editable product slug and product-code fields from normal administration. Product creation now generates a lowercase URL-safe slug with numeric collision suffixes and a sequence-backed `PRD-######` code; product renames preserve both identifiers.
- 2026-07-18: Consolidated the product editor's Short description and Full description controls into one Description field while continuing to populate the compatible catalog summary and detail fields on the backend.
- 2026-07-18: Verified all 44 backend tests on Java 21 with PostgreSQL/Flyway V1-V7/Hibernate/JAR packaging and all 50 frontend tests with lint, TypeScript, and the production build.

- 2026-07-17: Added Flyway V6 order, order-item, and delivery-address snapshot persistence with explicit lifecycle/payment states, idempotency constraints, and lookup indexes.
- 2026-07-17: Centralized purchasability and MNT pricing, including catalog-first then membership discounting, authoritative cart quotation, configured standard delivery, and transactional inventory locking/deduction.
- 2026-07-17: Replaced the minimal product page and fake cart controls with a complete product-detail gallery, persistent cart, protected checkout, order placement, and ownership-scoped success page.
- 2026-07-17: Verified 44 backend tests on Java 21 with PostgreSQL/Flyway V1-V6/Hibernate/JAR packaging, 48 frontend tests with lint/build, live anonymous-to-authenticated checkout, idempotent replay, cross-customer denial, inventory deduction, and responsive layouts at mobile, tablet, and desktop widths.

- 2026-07-17: Removed the Starts at and Ends at controls from normal banner administration. New and edited banners are saved without scheduling dates; legacy response fields remain compatible.

- 2026-07-16: Added Flyway V5 media metadata, an ADMIN-only multipart image endpoint, validated JPEG/PNG processing, purpose-specific limits/resizing, UUID storage keys, external local storage, read-only `/media/**` delivery, and media audit events.
- 2026-07-16: Replaced product, brand, banner, and news manual image-URL entry with a reusable progress-aware upload control while preserving compatible stored/external URLs.
- 2026-07-16: Verified 38 backend tests on Temurin Java 21 and 35 frontend tests, lint, production build, storage persistence across clean builds/restart, authorization/rejection paths, replacement immutability, public rendering, and 390×844 no-overflow layouts.

- 2026-07-16: Populated the current local PostgreSQL volume with non-production administration, customer, membership, address, category, brand, product, inventory, and news test records. Media fields remain empty and the dataset is intentionally not part of Flyway or production startup.
- 2026-07-16: Added Flyway V4 catalog administration fields, banner/news content, and a minimal admin audit log.
- 2026-07-16: Added ADMIN-only dashboard, category, brand, product, inventory, user, banner, and news APIs plus public banner/news reads.
- 2026-07-16: Added a responsive dark-sidebar administration shell and all Phase 5 admin routes inside the existing React authentication system.
- 2026-07-16: Replaced static storefront hero/news sources with active/scheduled API content and added public news detail routing.
- 2026-07-16: Verified 31 backend tests on Temurin Java 21 and 28 frontend tests, lint, and production build; live-verified admin access, catalog creation, draft/publish/archive visibility, same-image editing, inventory and membership flags, and 390×844 no-overflow navigation before removing temporary data.

- 2026-07-16: Added the V3 identity/account schema with seeded membership reference rows, normalized unique users, account status/role controls, discount rules, and ownership-bound delivery addresses.
- 2026-07-16: Added Spring Security session authentication, cookie/header CSRF, registration, login/logout, account self-service, lockout protection, and minimal admin user APIs.
- 2026-07-16: Added responsive login, registration, account, profile, addresses, and security routes with three-state auth hydration and safe protected-route returns.
- 2026-07-16: Clean verification passed with 27 backend and 25 frontend tests; live registration, login, address, logout, protected redirects, and 390×844 overflow checks also passed.

- 2026-07-15: Added `VITE_API_BASE_URL` and local Vite proxy configuration through the root environment boundary.
- 2026-07-15: Added a typed catalog client, backend DTO types, safe API errors, explicit frontend models, and request cancellation.
- 2026-07-15: Migrated home, category, brand, search, sort, pagination, and product-detail data flows to `/api/v1`.
- 2026-07-15: Removed obsolete category, brand, and product mocks plus the incorrect legacy product service; retained non-catalog marketing/news data.
- 2026-07-15: Added loading, empty, retry, safe failure, product 404, and unavailable-service UI states without changing the established design language.
- 2026-07-15: Added 10 frontend adapter/UI tests and added frontend tests to GitHub Actions and Jenkins.
- 2026-07-15: Verified live categories, brands, filters, sorting, pagination, product details, safe 400/404 handling, backend unavailability, news deep links, and a 390×844 responsive layout.
- 2026-07-15: Reverified the backend with 11 passing tests on Temurin Java 21, Flyway V1–V2, PostgreSQL 17, and Hibernate validation.

## Known issues

- This workstation already has services on ports 5432 and 8080. Its ignored `.env` uses PostgreSQL 5433, and integration uses Spring Boot 18080. Committed and production defaults remain 5432 and 8080.
- Direct cross-origin `VITE_API_BASE_URL` values require a deliberately configured backend/API gateway origin policy. No backend CORS configuration is added because local Vite and future NGINX use same-origin `/api` proxying.
- Frontend API DTOs are manually mirrored from the backend contract; future contract changes must update both sides and their tests together.
- Inventory is validated and deducted during order placement. A successfully created QPay invoice holds that stock until verified payment or successful application-managed provider cancellation at `QPAY_INVOICE_TTL`. A failed QPay initiation atomically cancels the order as payment `FAILED` and restores stock under product row locks; the inventory-release timestamp makes repeated cleanup idempotent. There is still no cart-time reservation, backorder, customer/admin cancellation workflow, or refund-driven stock policy.
- Checkout offers configurable-fee `STANDARD_DELIVERY` and zero-fee `SELF_PICKUP`. The pickup address, hours, and phone are deliberately marked sample data and must be replaced with the owner-confirmed collection location before launch. QPay remains disabled by default in committed configuration and fails explicitly until environment-owned merchant credentials, invoice code, and callback URL are configured. The current `trycloudflare.com` Quick Tunnel is temporary test infrastructure and is not a production callback origin. Refunds and settlement reporting are not implemented.
- The repository has a large uncommitted QPay/order-management worktree and local browser-verification artifacts. It requires a focused diff review and clean commit checkpoint after the P1 payment-failure correction; the ignored root `.env` must remain uncommitted.
- The cart is browser-local and anonymous-capable. It does not synchronize across devices or customer sessions, and server repricing can change or remove lines when stock/catalog state changes.
- Customer and administration order list/detail views are implemented. Standard delivery advances through confirmed, processing, shipped, and delivered; self-pickup advances directly from processing to collected/delivered. Cancellation/rejection and refund workflows remain deliberately unavailable until their financial and stock rules are defined.
- Variants, reviews, Ebarimt receipt issuance, payment refunds, and settlement reporting are not implemented.
- Password changes keep the current session valid and cannot invalidate other sessions until shared/session-registry infrastructure is deliberately added.
- WEBP is deliberately rejected until the Java runtime has a verified decoder/encoder; supported uploads are JPEG and PNG only.
- EXIF orientation is not normalized, so phone photos must already have display-correct pixel orientation.
- Existing external image URLs remain readable, but new administration uploads return same-origin `/media/...` URLs. There is no delete/reference-count endpoint yet, so replaced or removed files require a future safe orphan-maintenance job.
- Local storage and PostgreSQL must be backed up together. Production backup automation and an S3-compatible provider are designed but not implemented.
- Checkout and order amounts explicitly use MNT, but the older catalog tables still do not store a per-product currency. Product slugs are now backend-generated and stable across normal edits; there is still no redirect or alias policy for a future exceptional slug migration.

## Next recommended step

Verify one real payment through callback/check and one real invoice-expiry path without changing the order amount. Before staging, replace the temporary Quick Tunnel with a stable `api.hiliving.mn` HTTPS origin (public NGINX/Let's Encrypt or a named Cloudflare Tunnel), rotate the shared test credential into owner-controlled production credentials, align QPay's expiry with `QPAY_INVOICE_TTL`, and run the backend on an exact Java 21 runtime. Cancellation/refund and Ebarimt 3.0 policies plus production media/database backup rehearsal remain required before launch.
