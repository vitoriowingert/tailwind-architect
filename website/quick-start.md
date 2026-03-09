# Quick start

1. **Install** (in your project):

   ```bash
   npm install -D tailwind-architect
   ```

2. **Analyze** (see what’s wrong):

   ```bash
   npx tailwind-architect analyze .
   ```

3. **Fix** (apply sort, remove redundancy, apply suggestions):

   ```bash
   npx tailwind-architect fix .
   ```

4. **Lint in CI** (fail the build when there are issues):

   ```bash
   npx tailwind-architect lint .
   ```

Optional: add `tailwind-architect.config.json` at the project root to tune behavior (see [Configuration](/configuration)).
