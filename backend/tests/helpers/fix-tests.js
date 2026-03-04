const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'integration');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Skip if already has attachErrorHandler
  if (content.includes('attachErrorHandler')) {
    console.log('SKIP (already has it): ' + file);
    continue;
  }

  // Check if it has the mock app pattern
  if (!content.includes("jest.mock('../../src/app'")) {
    console.log('SKIP (no mock app): ' + file);
    continue;
  }

  // Find the "return {" block before "default: app" and insert attachErrorHandler
  const returnPattern = /(\n\s*)(return \{[\s\S]*?default:\s*app)/;
  const match = content.match(returnPattern);

  if (match) {
    const indent = match[1];

    // Add require inside the mock factory
    const mockPattern = /jest\.mock\('\.\.\/\.\.\/src\/app', \(\) => \{/;
    content = content.replace(
      mockPattern,
      "jest.mock('../../src/app', () => {\n  // eslint-disable-next-line global-require\n  const { attachErrorHandler } = require('../helpers/errorHandler');"
    );

    // Add attachErrorHandler(app) before the return
    content = content.replace(
      returnPattern,
      indent + 'attachErrorHandler(app);' + indent + match[2]
    );

    fs.writeFileSync(fullPath, content);
    console.log('FIXED: ' + file);
  } else {
    console.log('NO MATCH: ' + file);
  }
}
