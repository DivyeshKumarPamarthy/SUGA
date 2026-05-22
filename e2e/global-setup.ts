import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
  console.log('\n--- Playwright Global Setup: Seeding Database ---');
  try {
    const backendPath = path.resolve(__dirname, '../suga_backend');
    execSync('python3 manage.py seed_e2e_data', { cwd: backendPath, stdio: 'inherit' });
    console.log('--- Playwright Global Setup Complete ---\n');
  } catch (err) {
    console.error('Error during global setup seeding:', err);
    throw err;
  }
}

export default globalSetup;
