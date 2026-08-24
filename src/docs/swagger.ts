import path from 'node:path';
import swaggerJSDoc, { type OAS3Definition, type OAS3Options } from 'swagger-jsdoc';

/**
 * Base OpenAPI document. Route files add to `paths` via `@openapi` JSDoc
 * blocks above their handlers — this object only carries the metadata that
 * doesn't belong to any single endpoint.
 */
const definition: OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'Ecommerce Store API',
    version: '1.0.0',
    description:
      'Cart, checkout and nth-order discount APIs for an in-memory ecommerce store.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Health', description: 'Service availability' },
    { name: 'Products', description: 'Read-only product catalogue' },
  ],
};

const options: OAS3Options = {
  definition,
  // swagger-jsdoc scans these files for @openapi comment blocks at boot.
  // tsc preserves comments in its output by default, so the same glob
  // matches whichever form is actually running: `tsx watch` executes the
  // .ts sources directly, `node dist/server.js` executes the compiled .js.
  // Resolving from __dirname (rather than the process cwd) means this
  // works regardless of which directory `npm run dev`/`start` is invoked from.
  apis: [
    path.join(__dirname, '..', '**', '*.ts'),
    path.join(__dirname, '..', '**', '*.js'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
