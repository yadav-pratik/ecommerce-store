import { createApp } from './app';

/**
 * Process entry point: the only file that binds a port.
 * Keeping this separate from app.ts means tests import the app without
 * starting a server.
 */
const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
