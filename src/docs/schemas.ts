/**
 * Reusable OpenAPI component schemas.
 *
 * This file has no executable code — it only exists so swagger-jsdoc's file
 * scan has a home for shapes that are shared across multiple endpoints,
 * declared once and referenced with `$ref` instead of repeated inline.
 *
 * Domain schemas (Product, Cart, Order, DiscountCode) are added here as
 * those models are introduced in later stages, not before — this file
 * should only ever describe shapes that actually exist in the code.
 *
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       description: Uniform error shape returned by every failing response.
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: NOT_FOUND
 *             message:
 *               type: string
 *               example: Cannot GET /nope
 *           required: [code, message]
 *       required: [error]
 */
export {};
