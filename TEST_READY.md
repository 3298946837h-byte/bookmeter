# E2E Test Suite Ready

## Test Runner
- Command: `node tests/e2e/run-all-tests.js`
- Tiered Execution:
  - `node tests/e2e/run-all-tests.js --tier 1` (Feature Coverage)
  - `node tests/e2e/run-all-tests.js --tier 2` (Boundary & Corner Cases)
  - `node tests/e2e/run-all-tests.js --tier 3` (Cross-Feature Combinations)
  - `node tests/e2e/run-all-tests.js --tier 4` (Real-World Application Scenarios)
- Target Environment: Defaults to `http://127.0.0.1:5000` (auto-spawns server if not running; override via `TEST_BASE_URL=<url>`).
- Expected: All tests pass with exit code 0 when implementation milestones M1, M2, and M3 are complete.

## Coverage Summary
| Tier | Count | Description |
|------|------:|-------------|
| 1. Feature Coverage | 35 | 5 tests per feature across F1-F7 (search, options, EPUB/PDF/TXT downloads, tunnel status, search-to-download journey) |
| 2. Boundary & Corner | 35 | Boundary, edge cases, punctuation cleaning 《》“”, invalid IDs, unsupported formats, path traversal security, large streams, cache reuse |
| 3. Cross-Feature | 12 | Pairwise and triplet interactions (Search + Options, Search + EPUB/PDF/TXT, Tunnel + Search/Options/Download, multi-format consistency) |
| 4. Real-World Application | 8 | Realistic friend-sharing scenarios for 《百年孤独》, 《三体》, 《活着》, 《小王子》, 《解忧杂货店》, verifying magic bytes, sizes, and Content-Disposition |
| **Total** | **90** | Complete end-to-end requirement-driven test suite |

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|:------:|:------:|:------:|:------:|
| F1: Book Search API (`/api/search`) | 5 | 5 | ✓ | ✓ |
| F2: Ebook Options Discovery (`/api/ebooks/options`) | 5 | 5 | ✓ | ✓ |
| F3: Real EPUB Binary Download (`/api/ebooks/download?format=epub`) | 5 | 5 | ✓ | ✓ |
| F4: Real PDF Binary Download (`/api/ebooks/download?format=pdf`) | 5 | 5 | ✓ | ✓ |
| F5: Real TXT Binary Download (`/api/ebooks/download?format=txt`) | 5 | 5 | ✓ | ✓ |
| F6: Public Tunnel Status API (`/api/tunnel-status`) | 5 | 5 | ✓ | ✓ |
| F7: Search-to-Download Full Flow | 5 | 5 | ✓ | ✓ |

## Validation Highlights
- **Binary Magic Bytes**: Checks `50 4B 03 04` (PK..) for EPUB, `25 50 44 46` (%PDF) for PDF, and valid non-HTML UTF-8 text for TXT.
- **RFC 5987 / RFC 6266**: Validates UTF-8 Chinese filenames in `Content-Disposition`.
- **Zero-Setup Execution**: Built with native Node.js APIs (`fetch`, `http`), requiring zero npm test packages.
