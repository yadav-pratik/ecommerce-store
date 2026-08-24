/**
 * Reusable OpenAPI component schemas.
 *
 * This file has no executable code — it only exists so swagger-jsdoc's file
 * scan has a home for shapes that are shared across multiple endpoints,
 * declared once and referenced with `$ref` instead of repeated inline.
 *
 * Domain schemas (Cart, Order, DiscountCode) are added here as those
 * models are introduced in later stages, not before — this file should
 * only ever describe shapes that actually exist in the code.
 *
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: product-1
 *         name:
 *           type: string
 *           example: Wireless Mouse
 *         price:
 *           type: number
 *           example: 799
 *       required: [id, name, price]
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
