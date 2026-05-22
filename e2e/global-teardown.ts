import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalTeardown() {
  console.log('\n--- Playwright Global Teardown: Cleaning Database ---');
  try {
    const backendPath = path.resolve(__dirname, '../suga_backend');
    execSync('python3 manage.py flush_e2e_data', { cwd: backendPath, stdio: 'inherit' });
    console.log('--- Playwright Global Teardown Complete ---\n');
  } catch (err) {
    console.error('Error during global teardown flushing:', err);
  }
}

export default globalTeardown;
