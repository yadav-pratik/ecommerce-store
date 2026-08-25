/**
 * Reusable OpenAPI component schemas.
 *
 * This file has no executable code — it only exists so swagger-jsdoc's file
 * scan has a home for shapes that are shared across multiple endpoints,
 * declared once and referenced with `$ref` instead of repeated inline.
 *
 * This file should only ever describe shapes that actually exist in the
 * code — nothing is added here ahead of the model/route that needs it.
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
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           example: product-1
 *         quantity:
 *           type: integer
 *           example: 2
 *       required: [productId, quantity]
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: cart_1b4e28ba-2fa1-11d2-883f-0016d3cca427
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required: [id, items, createdAt]
 *     OrderItem:
 *       type: object
 *       description: A price snapshot at checkout time — not a live product reference.
 *       properties:
 *         productId:
 *           type: string
 *           example: product-1
 *         name:
 *           type: string
 *           example: Wireless Mouse
 *         unitPrice:
 *           type: number
 *           example: 799
 *         quantity:
 *           type: integer
 *           example: 2
 *         lineTotal:
 *           type: number
 *           example: 1598
 *       required: [productId, name, unitPrice, quantity, lineTotal]
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: order_1b4e28ba-2fa1-11d2-883f-0016d3cca427
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         subtotal:
 *           type: number
 *           example: 1598
 *         discountCode:
 *           type: string
 *           nullable: true
 *           description: Present only when a discount code was applied.
 *           example: SAVE10-X8K2
 *         discountAmount:
 *           type: number
 *           example: 0
 *         total:
 *           type: number
 *           example: 1598
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required: [id, items, subtotal, discountAmount, total, createdAt]
 *     DiscountCode:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: SAVE10-X8K2
 *         percentage:
 *           type: number
 *           example: 10
 *         milestone:
 *           type: integer
 *           description: Which nth-order eligibility this code was generated for.
 *           example: 1
 *         used:
 *           type: boolean
 *           example: false
 *         usedByOrderId:
 *           type: string
 *           nullable: true
 *           example: order_1b4e28ba-2fa1-11d2-883f-0016d3cca427
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required: [code, percentage, milestone, used, createdAt]
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
// A real export, not `export {}` — tsc's CommonJS output for a file whose
// only content is `export {}` drops the leading comment entirely (verified
// directly: `export {}` compiles to just the module boilerplate, with the
// JSDoc above it silently gone). A genuine export, even one nobody
// imports, keeps the comment attached in the compiled output too — which
// is what `npm start` actually reads (`npm run dev` reads the .ts source
// directly, so it never showed this bug).
export const openApiSchemasDocumentedInThisFile = true;
