# Schema Drift Detector for Voiden

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Voiden Plugin](https://img.shields.io/badge/Voiden-Community%20Plugin-6366f1.svg)](https://voiden.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/DivyaRaval1909/voiden-schema-drift-detector/pulls)

A community plugin for [Voiden](https://voiden.md) that automatically detects, inspects, and visualizes **structural schema drift**, **breaking API changes**, and **schema evolutions** across API executions.

Works seamlessly with both **JSON** and **XML** response payloads.

---

## ✨ Features

- **Deep Structural Schema Inference**: Automatically analyzes nested JSON and XML responses, mapping out structural node trees with primitive type checking (including formats like UUID, ISO date-time, email, and URLs).
- **Breaking Change Detection**: Flags critical breaking API regressions:
  - Removed fields
  - Mutated data types (e.g., `string` converted to `number` or object)
  - Array item structure regressions
  - Nullability shifts (non-nullable fields returning `null`)
- **Additive & Non-Breaking Evolution Tracking**: Highlights newly added fields and optional schema extensions without triggering false alarms.
- **Configurable Ignore Rules**: Ignore volatile or expected dynamic fields:
  - **Exact Path**: `meta.timestamp`, `id`
  - **Wildcard Glob**: `*.timestamp`, `data[].id`, `*_at`
  - **Regular Expressions**: `/(token|nonce|session)/i`
- **Baseline Schema Management**:
  - Auto-records initial baseline on first execution
  - Pin, lock, or manually update baselines per tab/request
  - One-click reset to re-establish a fresh baseline
- **Native Response Panel Integration**: Embeds directly into the Voiden response inspector with status badges, metric summaries (breaking, warnings, additions, ignored), search filtering, and clear visual diffs.
- **Export Comparison Reports**: Export complete audit reports in **Markdown tables**, **JSON**, **HTML**, and **ASCII Text** format.
- **Headless CI / Automated Testing Runner**: Programmatic API and CLI runner bundle for integration into automated test pipelines.

---

## 🚀 Installation

### Option 1: Install from ZIP in Voiden

1. Download `schema-drift-detector.zip` from the [Latest Release](https://github.com/DivyaRaval1909/voiden-schema-drift-detector/releases).
2. In Voiden, navigate to **Extensions** → **⋯** (More menu) → **Install from file**.
3. Select `schema-drift-detector.zip`.

### Option 2: CLI Runner (Headless)

```sh
voiden-runner plugin install schema-drift-detector
```

---

## 🛠️ Usage

1. Open any `.void` file in Voiden and send an API request.
2. On the initial execution, the plugin automatically captures and establishes the **Baseline Schema**.
3. Switch to the **Schema Drift** tab in the Response Panel to review the baseline structure.
4. Execute subsequent requests or test against staging/production endpoints:
   - If fields were removed or changed types, a **Breaking Change Warning** badge will be displayed.
   - Expand the diff item to inspect the baseline type vs. current type and example payload values.
5. Click **Ignore Rules** to mute dynamic timestamps, tokens, or IDs.
6. Click **Export Report** to export audit logs in Markdown, JSON, HTML, or Text.

---

## 🧩 Programmatic CI API

You can also use the schema drift engine directly in your node/CI workflows:

```typescript
import { runSchemaDriftCheck } from '@voiden/plugin-schema-drift-detector';

const result = runSchemaDriftCheck({
  baselineJsonOrSchema: { id: 1, name: 'Alice', active: true },
  currentResponseOrPayload: { id: '1', name: 'Alice', active: true }, // 'id' changed from number to string!
  ignoreRules: [
    { id: '1', pattern: '*.timestamp', type: 'wildcard', enabled: true },
  ],
});

if (result.hasBreakingChanges) {
  console.error('Breaking schema changes detected!\n');
  console.log(result.markdown);
  process.exit(1);
}
```

---

## 🏗️ Development & Building

### Prerequisites

- Node.js 18+ or Bun
- npm

### Setup

```sh
# Clone repository
git clone https://github.com/DivyaRaval1909/voiden-schema-drift-detector.git
cd voiden-schema-drift-detector

# Install dependencies
npm install
```

### Running Tests

```sh
npm test
# or with bun
bun test
```

### Building the Plugin

```sh
# Builds renderer bundle, main-process, and runner bundle
npm run build

# Package into installable zip
npm run zip
```

Build outputs:
- `dist/schema-drift-detector.js` (Renderer bundle for Voiden)
- `dist/schema-drift-detector-runner.js` (Headless runner bundle)
- `dist/schema-drift-detector.zip` (Installable archive)

---

## 📂 Project Layout

```
├── manifest.json              # Plugin identity, capabilities & permissions
├── changelog.json             # Release notes
├── package.json               # Dependencies and build scripts
├── build.mjs                  # Renderer bundle builder (Vite + shims)
├── build-main.mjs             # Main-process bundle builder
├── build-runner.mjs           # CLI runner builder
├── zip.mjs                    # Zip packaging utility
├── generate-manifest.mjs      # Release manifest generator
├── .github/workflows/
│   └── release.yml            # Automated GitHub release on v* tags
└── src/
    ├── plugin.ts              # Entry point default-exporting plugin
    ├── main.ts                # Lifecycle registration (Response panel, hooks, status bar)
    ├── types.ts               # TypeScript interfaces
    ├── runner.ts              # Headless CI runner & RunnerFactory
    ├── store/
    │   └── driftStore.ts      # State management for baselines & reports
    ├── components/
    │   ├── SchemaDriftSection.tsx # Response Panel diff viewer
    │   └── IgnoreRulesModal.tsx   # Ignore rules manager dialog
    ├── utils/
    │   ├── schemaInferrer.ts  # Deep JSON/XML structural inference
    │   ├── driftComparator.ts # Breaking change detection & diff engine
    │   └── reportExporter.ts  # Markdown, JSON, HTML, Text exporters
    └── __tests__/             # Unit and integration test suite
```

---

## 📄 License

[MIT](LICENSE) © Divya Raval
