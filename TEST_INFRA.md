# E2E Test Infra: BookMeter 真实电子书下载与公网免代理分享系统

## Test Philosophy
- **Opaque-box & Requirement-Driven**: Tests are designed strictly from the end-user requirements defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`, treating the server and tunnel as black boxes via HTTP/HTTPS protocols.
- **Zero-Setup & Standalone**: Executable directly via standard Node.js runtime (`node tests/e2e/run-all-tests.js`) without requiring external test frameworks (like Jest/Mocha), ensuring zero dependency drift and instant execution.
- **Deep Binary Integrity Validation**: Validates actual binary stream payloads, magic bytes (`50 4B 03 04` for EPUB, `25 50 44 46` for PDF, UTF-8 text for TXT), non-empty file lengths, and RFC 5987 / RFC 6266 `Content-Disposition` attachment headers.
- **Methodology**: Systematic 4-tier methodology adhering to Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Realistic Application Workloads.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|--------|:------:|:------:|:------:|:------:|
| F1 | Book Search API (`/api/search`) | R1 / AC 1 | 5 | 5 | ✓ | ✓ |
| F2 | Ebook Download Options Discovery (`/api/ebooks/options`) | R1 / AC 1 | 5 | 5 | ✓ | ✓ |
| F3 | Real EPUB Binary Download (`/api/ebooks/download?format=epub`) | R1 / AC 2 | 5 | 5 | ✓ | ✓ |
| F4 | Real PDF Binary Download (`/api/ebooks/download?format=pdf`) | R1 / AC 2 | 5 | 5 | ✓ | ✓ |
| F5 | Real TXT Binary Download (`/api/ebooks/download?format=txt`) | R1 / AC 2 | 5 | 5 | ✓ | ✓ |
| F6 | Public Tunnel Status & URL Discovery (`/api/tunnel-status`) | R3 / AC 3 | 5 | 5 | ✓ | ✓ |
| F7 | Full Search-to-Download Journey (End-to-End File Retrieval) | Follow-up | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: `node tests/e2e/run-all-tests.js`
- **Environment Targeting**: Automatically tests target server (defaults to `http://127.0.0.1:5000`, configurable via `TEST_BASE_URL` environment variable; also tests public tunnel if active in `/api/tunnel-status`).
- **Pass/Fail Semantics**: Process exits with code `0` when 100% of tests pass; exits with code `1` if any test fails, outputting detailed assertion failures and timing metrics.
- **Directory Layout**:
  ```
  tests/e2e/
  ├── helpers/
  │   └── test-client.js             # HTTP/HTTPS client with binary stream handling & magic byte checks
  ├── tier1-feature-coverage.test.js  # Tier 1: 35 tests covering F1-F7 happy paths
  ├── tier2-boundary-corner.test.js   # Tier 2: 35 tests covering boundary, corner, error resilience
  ├── tier3-cross-feature.test.js     # Tier 3: 12 tests covering cross-feature & pairwise flows
  ├── tier4-application-scenarios.test.js # Tier 4: 8 realistic end-to-end user scenarios
  └── run-all-tests.js                # Consolidated test runner with summary table & exit code
  ```

## 4-Tier Test Breakdown

### Tier 1: Feature Coverage (≥5 per feature, 35 tests)
1. **F1: Search**:
   - T1.1: Search by standard Chinese title (`百年孤独`) returns structured book results.
   - T1.2: Search by author name (`余华`) returns matching books.
   - T1.3: Search by English title (`The Little Prince`) returns matching books.
   - T1.4: Search result items contain required fields (`id`, `title`, `author`, `coverUrl`, `rating`).
   - T1.5: Multi-word query (`三体 刘慈欣`) returns relevant match.
2. **F2: Ebook Options Discovery**:
   - T2.1: Query options for catalog book returns `hasEbook: true` and `formats` array.
   - T2.2: Options response includes `epub` format with valid download URL.
   - T2.3: Options response includes `pdf` format with valid download URL.
   - T2.4: Options response includes `txt` format with valid download URL.
   - T2.5: Format entries contain positive integer `sizeBytes` and human-readable `sizeFormatted`.
3. **F3: EPUB Binary Download**:
   - T3.1: Download EPUB returns HTTP 200.
   - T3.2: Content-Type header is `application/epub+zip` or `application/octet-stream`.
   - T3.3: Content-Disposition header indicates `attachment; filename="*.epub"`.
   - T3.4: File size is greater than 1024 bytes (non-empty).
   - T3.5: Magic bytes match EPUB ZIP container header `50 4B 03 04` (`PK..`).
4. **F4: PDF Binary Download**:
   - T4.1: Download PDF returns HTTP 200.
   - T4.2: Content-Type header is `application/pdf` or `application/octet-stream`.
   - T4.3: Content-Disposition header indicates `attachment; filename="*.pdf"`.
   - T4.4: File size is greater than 1024 bytes (non-empty).
   - T4.5: Magic bytes match PDF header `25 50 44 46` (`%PDF`).
5. **F5: TXT Binary Download**:
   - T5.1: Download TXT returns HTTP 200.
   - T5.2: Content-Type header indicates `text/plain`.
   - T5.3: Content-Disposition header indicates `attachment; filename="*.txt"`.
   - T5.4: File size is greater than 100 bytes (non-empty).
   - T5.5: File content is valid UTF-8 text and does NOT contain HTML error boilerplate (`<!DOCTYPE html>` or `404`).
6. **F6: Tunnel Status API**:
   - T6.1: `GET /api/tunnel-status` returns HTTP 200 with JSON payload.
   - T6.2: Tunnel status payload contains boolean field `active` or `enabled`.
   - T6.3: Tunnel status payload contains `status` string (`online`, `offline`, or `standby`).
   - T6.4: Tunnel status payload contains `localPort` integer (5000).
   - T6.5: Tunnel status response completes within 500ms (fast health check).
7. **F7: Search-to-Download Journey**:
   - T7.1: Search query -> extract first result id -> query options -> verify options available.
   - T7.2: Search query -> download options -> execute EPUB download -> verify downloaded stream.
   - T7.3: Search query -> download options -> execute PDF download -> verify downloaded stream.
   - T7.4: Search query -> download options -> execute TXT download -> verify downloaded stream.
   - T7.5: Search-to-download journey preserves original book title in Content-Disposition filename.

### Tier 2: Boundary & Corner Cases (≥5 per feature, 35 tests)
1. **Search Boundary Cases**:
   - T2.1.1: Empty query string (`/api/search?q=`) returns graceful 400 or empty results, no crash.
   - T2.1.2: Chinese book punctuation 《百年孤独》 is automatically sanitized and searches correctly.
   - T2.1.3: Quoted query `“三体”` and `'活着'` are sanitized and search successfully.
   - T2.1.4: Extreme length query (500+ characters) is handled gracefully without 500 crash.
   - T2.1.5: Non-existent / random gibberish title (`xkj9102381023u1aslkd`) returns zero dead-end response with fallback links.
2. **Options Discovery Boundaries**:
   - T2.2.1: Missing `id` parameter returns graceful 400 error.
   - T2.2.2: Negative or non-numeric ID (`/api/ebooks/options?id=-999`) handled without crash.
   - T2.2.3: Unknown book without ebook returns `hasEbook: false` or friendly empty formats array.
   - T2.2.4: Special characters in title/author query params are properly decoded and sanitized.
   - T2.2.5: Rapid concurrent requests (10 parallel requests) to options endpoint return consistent responses.
3. **EPUB Download Boundaries**:
   - T2.3.1: Unsupported format parameter (`format=mobi` or `format=exe`) returns 400 Bad Request.
   - T2.3.2: Non-existent book download request returns 404 with JSON error message.
   - T2.3.3: Download request with missing format defaults gracefully or returns 400.
   - T2.3.4: Range header handling (`Range: bytes=0-100`) responds with 206 Partial Content or 200 OK without crashing.
   - T2.3.5: HTTP HEAD request on download endpoint returns valid Content-Type and Content-Length headers without streaming body.
4. **PDF Download Boundaries**:
   - T2.4.1: Download non-existent book PDF returns 404.
   - T2.4.2: Large file streaming does not buffer entire file into memory before streaming (checks chunked transfer / stream pipe).
   - T2.4.3: Aborted client connection does not trigger unhandled rejection on server.
   - T2.4.4: Path traversal attack prevention (`id=../../etc/passwd` or `format=../../secret`) returns 400 or 404, preventing directory breakout.
   - T2.4.5: UTF-8 Chinese filename encoding in `Content-Disposition` uses RFC 5987 `filename*=UTF-8''...` to avoid mojibake on Windows/iOS.
5. **TXT Download Boundaries**:
   - T2.5.1: Missing book ID returns 400 or 404.
   - T2.5.2: TXT download does not serve raw HTML error page as `.txt`.
   - T2.5.3: Chinese characters in TXT payload are encoded in valid UTF-8 without byte replacement artifacts.
   - T2.5.4: Concurrent downloads of the same TXT file resolve safely without race conditions.
   - T2.5.5: Empty or 0-byte files are never served as valid books.
6. **Tunnel Status Boundaries**:
   - T2.6.1: Tunnel offline scenario reports `active: false` without hanging.
   - T2.6.2: Tunnel API responds even if cloudflared binary is not currently installed or running.
   - T2.6.3: Method not allowed (POST /api/tunnel-status) is rejected cleanly.
   - T2.6.4: Tunnel endpoint does not expose internal host credentials or secret environment variables.
   - T2.6.5: Tunnel status stays responsive under 20 concurrent queries.
7. **Resilience Boundaries**:
   - T2.7.1: Network timeout resilience: server handles slow upstream resolution without hanging client forever (timeout within 30s).
   - T2.7.2: High concurrency search-to-download does not exhaust open file descriptors.
   - T2.7.3: Cache reuse: second download of the same book completes in < 50ms from local cache.
   - T2.7.4: Cache integrity: cached files match original magic bytes and sizes.
   - T2.7.5: Server restart resilience: server continues serving cached ebooks after reload.

### Tier 3: Cross-Feature Combinations (12 tests)
- **T3.1**: Pairwise Search + Options: Search `百年孤独` -> query options with returned ID -> verify options match book title.
- **T3.2**: Pairwise Search + EPUB: Search `百年孤独` -> download EPUB -> verify EPUB magic bytes.
- **T3.3**: Pairwise Search + PDF: Search `三体` -> download PDF -> verify PDF magic bytes.
- **T3.4**: Pairwise Search + TXT: Search `活着` -> download TXT -> verify UTF-8 content.
- **T3.5**: Full Chain Triplet: Search `小王子` -> fetch options -> download both EPUB and PDF -> verify both magic bytes.
- **T3.6**: Tunnel + Search Flow: Check tunnel status -> query search endpoint -> verify public search capability.
- **T3.7**: Tunnel + Options Flow: Check tunnel status -> query options endpoint.
- **T3.8**: Tunnel + Download Flow: Check tunnel status -> execute download -> verify stream headers.
- **T3.9**: Cache Interplay: Query options -> download EPUB -> query options again -> verify cached status flag.
- **T3.10**: Multi-Format Download Consistency: Download EPUB, PDF, and TXT for same book -> verify title consistency in filenames.
- **T3.11**: Search Sanitization + Download: Search with 《百年孤独》 -> resolve download -> verify successful stream.
- **T3.12**: Public Share Link Integration: Verify tunnel public URL matches format `https://*.trycloudflare.com` or local fallback URL for sharing.

### Tier 4: Real-World Application Scenarios (8 tests)
- **Scenario 1: 《百年孤独》完整好友分享与下载链路**
  - Simulate friend receiving sharing link, opening site, searching 《百年孤独》, picking EPUB format, downloading full genuine EPUB (>100KB, starts with `PK..`).
- **Scenario 2: 《三体》PDF版免翻墙即开即下**
  - Simulate friend searching 《三体》, selecting PDF, downloading full genuine PDF (>500KB, starts with `%PDF-`).
- **Scenario 3: 《活着》TXT版纯文本完整下载**
  - Simulate friend searching 《活着》, selecting TXT, downloading UTF-8 text file (>50KB, contains chapter headers, no HTML tags).
- **Scenario 4: 《小王子》中英双语多格式支持**
  - Simulate friend searching 《小王子》 (or The Little Prince), verifying EPUB and PDF availability and downloading valid file.
- **Scenario 5: 《解忧杂货店》真实电子书下载**
  - Simulate friend searching 《解忧杂货店》, downloading EPUB/PDF, verifying file integrity.
- **Scenario 6: 移动端用户连续搜索与多本下载流程**
  - Simulate mobile user searching book A, downloading, then immediately searching book B and downloading without page refresh or session lock.
- **Scenario 7: 网络抖动与重复点击下载防护**
  - Rapid double-click on download button triggers clean streaming without corrupted file or server crash.
- **Scenario 8: 终极端到端验收：“发给朋友，随便搜本书，直接下到电子版”**
  - Complete simulation of friend clicking shared link -> searching curated title -> downloading genuine non-empty electronic book -> verifying file size, MIME type, Content-Disposition, and magic bytes.

## Coverage Summary
- Tier 1: 35 tests
- Tier 2: 35 tests
- Tier 3: 12 tests
- Tier 4: 8 tests
- **Total Test Cases: 90 tests**
