# Validation Status

- Production TypeScript project compilation: PASS (`tsc -b`)
- Test TypeScript compilation: PASS (`tsc --noEmit -p tsconfig.test.json`)
- Vitest execution: not run in this Linux environment because the supplied `node_modules` archive lacks the Linux Rollup native package.
- Oxlint execution: not run because the supplied archive lacks the Linux Oxlint native binding.
- Vite bundle: blocked by the same missing Linux Rollup native package.

Run `npm ci` on the target platform before executing `npm run check`.
