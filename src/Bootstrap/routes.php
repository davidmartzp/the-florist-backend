<?php
declare(strict_types=1);

/**
 * Rutas de negocio.
 * Se van agregando módulo a módulo según el plan de refactorización.
 *
 * Módulos completados:
 *   [x] 0 — Scaffolding
 *   [x] 4 — Auth  ← (adelantado por prioridad práctica)
 *   [ ] 1 — Tags
 *   [ ] 2 — Categories
 *   [ ] 3 — Catalogs
 *   [ ] 5 — Access Control + Users
 *   [ ] 6 — Site Categories + Site Shipping Methods
 *   [ ] 7 — Shipping Methods (CMS)
 *   [ ] 8 — Products (CMS + Site)
 *   [ ] 9 — Site Cart
 *   [x] 10 — Orders (CMS)
 *   [x] 11 — Checkout / MercadoPago
 */

use App\Controllers\AuthController;
use App\Controllers\CartController;
use App\Controllers\OrderController;
use App\Controllers\Site\SiteCheckoutController;
use App\Controllers\CatalogController;
use App\Controllers\CategoryController;
use App\Controllers\ProductController;
use App\Controllers\ShippingMethodController;
use App\Controllers\TagController;
use App\Controllers\UserController;
use App\Middleware\AuthMiddleware;
use App\Middleware\RequirePermissionsMiddleware;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api', function (RouteCollectorProxy $api) {

    // ── Auth (público) ────────────────────────────────────────────────────────
    $api->group('/auth', function (RouteCollectorProxy $auth) {
        $auth->post('/login', function ($req, $res) {
            return (new AuthController())->login($req, $res);
        });
        $auth->post('/forgot-password', function ($req, $res) {
            return (new AuthController())->forgotPassword($req, $res);
        });
        $auth->post('/reset-password', function ($req, $res) {
            return (new AuthController())->resetPassword($req, $res);
        });
    });

    // ── CMS (protegido con JWT) ───────────────────────────────────────────────

    // ── Products (PRODUCTS) ──────────────────────────────────────────────────
    $api->group('/products', function (RouteCollectorProxy $g) {
        $g->get('', function ($req, $res) {
            return (new ProductController())->list($req, $res);
        });
        // price-history ANTES de /{productId} para evitar conflicto de rutas
        $g->get('/{productId}/price-history', function ($req, $res, $args) {
            return (new ProductController())->priceHistory($req, $res, $args);
        });
        $g->get('/{productId}', function ($req, $res, $args) {
            return (new ProductController())->get($req, $res, $args);
        });
        $g->post('', function ($req, $res) {
            return (new ProductController())->create($req, $res);
        });
        $g->patch('/{productId}', function ($req, $res, $args) {
            return (new ProductController())->update($req, $res, $args);
        });
        $g->patch('/{productId}/toggle-active', function ($req, $res, $args) {
            return (new ProductController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('PRODUCTS'))
    ->add(new AuthMiddleware());

    // ── Tags (PRODUCTS) ───────────────────────────────────────────────────────
    $api->group('/tags', function (RouteCollectorProxy $g) {
        $g->post('', function ($req, $res) {
            return (new TagController())->create($req, $res);
        });
        $g->patch('/{tagId}/toggle-active', function ($req, $res, $args) {
            return (new TagController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('PRODUCTS'))
    ->add(new AuthMiddleware());

    // ── Categories (PRODUCTS) ─────────────────────────────────────────────────
    $api->group('/categories', function (RouteCollectorProxy $g) {
        $g->get('', function ($req, $res) {
            return (new CategoryController())->list($req, $res);
        });
        $g->get('/{categoryId}', function ($req, $res, $args) {
            return (new CategoryController())->get($req, $res, $args);
        });
        $g->post('', function ($req, $res) {
            return (new CategoryController())->create($req, $res);
        });
        $g->patch('/{categoryId}', function ($req, $res, $args) {
            return (new CategoryController())->update($req, $res, $args);
        });
        $g->patch('/{categoryId}/toggle-active', function ($req, $res, $args) {
            return (new CategoryController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('PRODUCTS'))
    ->add(new AuthMiddleware());

    // ── Users + Access Control (USERS) ───────────────────────────────────────
    $api->group('/users', function (RouteCollectorProxy $g) {
        $g->get('/access-control', function ($req, $res) {
            return (new UserController())->getAccessControlCatalog($req, $res);
        });
        $g->get('', function ($req, $res) {
            return (new UserController())->list($req, $res);
        });
        $g->get('/{userId}', function ($req, $res, $args) {
            return (new UserController())->get($req, $res, $args);
        });
        $g->post('', function ($req, $res) {
            return (new UserController())->create($req, $res);
        });
        $g->patch('/{userId}', function ($req, $res, $args) {
            return (new UserController())->update($req, $res, $args);
        });
        $g->patch('/{userId}/toggle-active', function ($req, $res, $args) {
            return (new UserController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('USERS'))
    ->add(new AuthMiddleware());

    // ── Catalogs (PRODUCTS) ──────────────────────────────────────────────────
    $api->group('/catalogs', function (RouteCollectorProxy $g) {
        $g->get('', function ($req, $res) {
            return (new CatalogController())->list($req, $res);
        });
        $g->get('/{catalogId}', function ($req, $res, $args) {
            return (new CatalogController())->get($req, $res, $args);
        });
        $g->post('', function ($req, $res) {
            return (new CatalogController())->create($req, $res);
        });
        $g->patch('/{catalogId}', function ($req, $res, $args) {
            return (new CatalogController())->update($req, $res, $args);
        });
        $g->patch('/{catalogId}/toggle-active', function ($req, $res, $args) {
            return (new CatalogController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('PRODUCTS'))
    ->add(new AuthMiddleware());

    // ── Orders (ORDERS) ──────────────────────────────────────────────────────
    $api->group('/orders', function (RouteCollectorProxy $g) {
        // export ANTES de /{orderId} para evitar conflicto de rutas
        $g->get('/export', function ($req, $res) {
            return (new OrderController())->export($req, $res);
        });
        $g->get('', function ($req, $res) {
            return (new OrderController())->list($req, $res);
        });
        $g->get('/{orderId}', function ($req, $res, $args) {
            return (new OrderController())->get($req, $res, $args);
        });
        $g->post('', function ($req, $res) {
            return (new OrderController())->create($req, $res);
        });
        $g->patch('/{orderId}', function ($req, $res, $args) {
            return (new OrderController())->update($req, $res, $args);
        });
        $g->patch('/{orderId}/toggle-active', function ($req, $res, $args) {
            return (new OrderController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('ORDERS'))
    ->add(new AuthMiddleware());

    // ── Shipping Methods (ORDERS) ─────────────────────────────────────────────
    $api->group('/shipping-methods', function (RouteCollectorProxy $g) {
        $g->get('', function ($req, $res) {
            return (new ShippingMethodController())->list($req, $res);
        });
        $g->get('/{shippingMethodId}', function ($req, $res, $args) {
            return (new ShippingMethodController())->get($req, $res, $args);
        });
        $g->post('', function ($req, $res) {
            return (new ShippingMethodController())->create($req, $res);
        });
        $g->patch('/{shippingMethodId}', function ($req, $res, $args) {
            return (new ShippingMethodController())->update($req, $res, $args);
        });
        $g->patch('/{shippingMethodId}/toggle-active', function ($req, $res, $args) {
            return (new ShippingMethodController())->toggleActive($req, $res, $args);
        });
    })
    ->add(new RequirePermissionsMiddleware('ORDERS'))
    ->add(new AuthMiddleware());

    // ── Site (público) ────────────────────────────────────────────────────────
    $api->group('/site', function (RouteCollectorProxy $site) {
        $site->get('/categories', function ($req, $res) {
            return (new CategoryController())->listSite($req, $res);
        });
        $site->get('/shipping-methods', function ($req, $res) {
            return (new ShippingMethodController())->listSite($req, $res);
        });
        // slug ANTES de /{productId}
        $site->get('/products/slug/{productSlug}', function ($req, $res, $args) {
            return (new ProductController())->getSiteBySlug($req, $res, $args);
        });
        $site->get('/products/{productId}', function ($req, $res, $args) {
            return (new ProductController())->getSite($req, $res, $args);
        });
        $site->get('/products', function ($req, $res) {
            return (new ProductController())->listSite($req, $res);
        });
        $site->get('/cart/complements', function ($req, $res) {
            return (new CartController())->listComplements($req, $res);
        });
        $site->post('/cart/items', function ($req, $res) {
            return (new CartController())->validateCartItem($req, $res);
        });
        // checkout ANTES de /checkout/confirm y /checkout/webhook para evitar ambigüedades
        $site->post('/checkout/webhook', function ($req, $res) {
            return (new SiteCheckoutController())->receiveWebhook($req, $res);
        });
        $site->post('/checkout/confirm', function ($req, $res) {
            return (new SiteCheckoutController())->confirmCheckout($req, $res);
        });
        $site->post('/checkout', function ($req, $res) {
            return (new SiteCheckoutController())->createCheckoutPreference($req, $res);
        });
    });
});
