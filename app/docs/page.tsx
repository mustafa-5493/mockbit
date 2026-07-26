"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Copy,
  Check,
  Code2,
  Layers,
  Database,
  Globe,
  Sparkles,
  Zap,
  ShieldCheck,
  Sliders,
  ArrowRight,
  BookOpen,
  Terminal,
  Cpu,
  FileCode2,
  Calculator,
  Calendar,
  Clock,
  Shuffle,
  Tag,
} from "lucide-react";

function MarkIcon() {
  return (
    <svg className="w-5 h-5 text-mb-text shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 17l6-6-6-6M12 19h8" />
    </svg>
  );
}

interface DocSection {
  id: string;
  category: string;
  title: string;
  description: string;
  syntax: string;
  sampleRequest?: string;
  sampleResponse: string;
  tags: string[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "overview",
    category: "Overview & Runtime",
    title: "Template Engine Overview & Priority Pipeline",
    description:
      "Mockbit includes a Handlebars-compatible dynamic response generator. Mockbit evaluates mock rules using a 5-Tier Priority Pipeline and attaches diagnostic tracing headers (X-Mockbit-Execution-Tier). Template syntax errors return HTTP Status 561.",
    syntax: `// Priority Tier Header Attached to Responses:
X-Mockbit-Execution-Tier: conditional_rule | weighted_split | chaos_fault | stateful_store

// Invalid syntax return header & status:
HTTP/1.1 561 Template Syntax Error
X-Mockbit-Error: Template Evaluation Error`,
    sampleResponse: `{
  "status": "active",
  "tier": "conditional_rule"
}`,
    tags: ["overview", "headers", "pipeline", "561", "tiers"],
  },
  {
    id: "request-data",
    category: "Request Data Helpers",
    title: "Reusing Request Payload, Query, Headers & Cookies",
    description:
      "Extract values from request JSON bodies, URL query parameters, HTTP headers, and cookies. Use triple curly braces {{{...}}} to prevent HTML entity encoding.",
    syntax: `{
  "user_id": "{{body 'user.id'}}",
  "query_page": {{queryParam 'page' '1'}},
  "auth_token": "{{header 'Authorization'}}",
  "session": "{{cookie 'session_id'}}",
  "raw_json": {{{body 'metadata'}}}
}`,
    sampleRequest: `POST /orders?page=2
Header: Authorization: Bearer token_abc
Cookie: session_id=sess_99
Body: { "user": { "id": "usr_77" }, "metadata": { "source": "mobile" } }`,
    sampleResponse: `{
  "user_id": "usr_77",
  "query_page": 2,
  "auth_token": "Bearer token_abc",
  "session": "sess_99",
  "raw_json": { "source": "mobile" }
}`,
    tags: ["body", "queryParam", "header", "cookie", "unescaped"],
  },
  {
    id: "multi-format",
    category: "Request Body Parsers",
    title: "Form URL-Encoded & XML-to-JSON Body Parsers",
    description:
      "Mockbit automatically intercepts application/x-www-form-urlencoded and application/xml Content-Types. XML elements and attributes are normalized into JSON key-value dot notation.",
    syntax: `// Form URL-Encoded: name=John+Doe&items%5B0%5D=10
{{body 'name'}} -> "John Doe"

// XML Payload: <order><id>ORD-101</id><customer name="Acme"/></order>
{{body 'order.id'}} -> "ORD-101"
{{body 'order.customer.@_name'}} -> "Acme"`,
    sampleRequest: `POST /xml-endpoint
Content-Type: application/xml
Payload: <order><id>ORD-101</id><customer name="Acme"/></order>`,
    sampleResponse: `{
  "orderId": "ORD-101",
  "customerName": "Acme"
}`,
    tags: ["xml", "form-urlencoded", "parsers", "dot-notation"],
  },
  {
    id: "soap-matcher",
    category: "SOAP Services",
    title: "SOAP 5-Source Operation Matcher & Namespace Stripping",
    description:
      "Targets SOAP/XML operations across 5 prioritized sources: SOAPAction HTTP Header, Content-Type action attribute, SOAP Body root element, SOAPAction query param, and URL path fallback. Strips XML namespaces automatically.",
    syntax: `// Request XML:
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <GetCityWeatherByZIP>
      <ZIP>90210</ZIP>
    </GetCityWeatherByZIP>
  </soapenv:Body>
</soapenv:Envelope>

// Template Expression:
"cityZip": "{{body 'Envelope.Body.GetCityWeatherByZIP.ZIP'}}"` ,
    sampleResponse: `{
  "cityZip": "90210",
  "soapOperation": "GetCityWeatherByZIP"
}`,
    tags: ["soap", "xml", "soapaction", "namespaces"],
  },
  {
    id: "faker-engine",
    category: "Synthetic Data",
    title: "Faker.js Engine & 15+ Date Formatting Shorthands",
    description:
      "Generate synthetic realistic data using Handlebars faker helper {{faker 'namespace.method' 'arg2'}}. Includes 15+ date formatting shorthands (iso, utc, us, eu, sql, compact, timestamp, unix).",
    syntax: `{
  "id": "{{faker 'string.uuid'}}",
  "name": "{{faker 'person.firstName'}}",
  "country": "{{faker 'location.country'}}",
  "futureIso": "{{faker 'date.future' 'iso'}}",
  "pastUs": "{{faker 'date.past' 'us'}}",
  "pastSql": "{{faker 'date.past' 'sql'}}",
  "compactId": "{{faker 'date.past' 'compact'}}",
  "numberRange": {{faker 'number.int' '{min:500, max:600}'}}
}`,
    sampleResponse: `{
  "id": "395a5b1f-c40e-49bd-bcce-9d2e89605713",
  "name": "Victoria",
  "country": "Spain",
  "futureIso": "2027-01-18T15:45:25.032Z",
  "pastUs": "09/04/2025",
  "pastSql": "2025-09-04 15:45:25",
  "compactId": "20250904154525",
  "numberRange": 563
}`,
    tags: ["faker", "uuid", "dates", "shorthands", "synthetic"],
  },
  {
    id: "date-operators",
    category: "Date & Time Operators",
    title: "Relative {{now}}, dateAdd, dateDiff & dateParse",
    description:
      "Perform relative date-time offset calculations, parse timestamps, calculate duration differences between dates, and format output using shorthand or custom date patterns.",
    syntax: `{
  "nowUtc": "{{now 'utc'}}",
  "nowPlus5m": "{{now '{minutes:5}' 'utc'}}",
  "nowPlus3h": "{{now (object hours=3) 'iso'}}",
  "dateAdded": "{{dateAdd '2026-02-25T05:15:05Z' '{days:3}' 'iso'}}",
  "dateSubtracted": "{{dateAdd '2026-02-25T05:15:05Z' '{hours:-5}' 'utc'}}",
  "daysDifference": {{dateDiff '2026-02-25T05:15:05Z' '2026-02-28T05:15:05Z' 'days'}}
}`,
    sampleResponse: `{
  "nowUtc": "2026-07-24T13:22:02Z",
  "nowPlus5m": "2026-07-24T13:27:02Z",
  "nowPlus3h": "2026-07-24T16:22:02Z",
  "dateAdded": "2026-02-28T05:15:05.000Z",
  "dateSubtracted": "2026-02-25T00:15:05Z",
  "daysDifference": 3
}`,
    tags: ["now", "dateAdd", "dateDiff", "dateParse", "relative-time"],
  },
  {
    id: "control-flow",
    category: "Control Flow Constructs",
    title: "#switch, #if / #unless, #repeat & #each Loops",
    description:
      "Customize response structures conditionally. #repeat handles fixed or random loop counts with intelligent JSON comma insertion. #each loops over JSON request arrays with @index, @first, @last, and this.",
    syntax: `{
  "userRole": {{#switch (queryParam 'id')}}{{#case '1'}}"Alex"{{/case}}{{#case '2'}}"Jenny"{{/case}}{{#default}}"Guest"{{/default}}{{/switch}},
  "amountToCollect": {{#if (eq 'paid' (body 'status'))}}0{{else}}{{body 'amount'}}{{/if}},
  "items": [
    {{#repeat 3}}
      { "id": {{@index}}, "name": "Dave" }
    {{/repeat}}
  ],
  "transformed": [
    {{#each (body 'listOfItems')}}
      { "rank": {{@index}}, "title": "{{this.name}}" }{{#unless @last}},{{/unless}}
    {{/each}}
  ]
}`,
    sampleResponse: `{
  "userRole": "Alex",
  "amountToCollect": 0,
  "items": [
    { "id": 0, "name": "Dave" },
    { "id": 1, "name": "Dave" },
    { "id": 2, "name": "Dave" }
  ],
  "transformed": [
    { "rank": 0, "title": "Item A" },
    { "rank": 1, "title": "Item B" }
  ]
}`,
    tags: ["switch", "if", "unless", "repeat", "each", "loops"],
  },
  {
    id: "stateful-mocks",
    category: "Stateful Persistence",
    title: "Step Counter, Data Store, 12 List Operations & Raw JSON",
    description:
      "Persist state between independent API requests. Maintain sequential order IDs with step-counter, store key-values with data-store, and manage collections using 12 list operations (Stack LIFO, Queue FIFO, Set unique, Array indexing).",
    syntax: `// Order ID Generation:
{{step-counter 'inc' 'orderCounter' 1}}
"orderId": {{step-counter 'get' 'orderCounter'}}

// Key-Value Persistence:
{{data-store 'set' 'lastOrder' (body 'orderId')}}
"previousOrder": "{{data-store 'get' 'lastOrder'}}"

// List Operations (Stack/Queue/Set):
{{list 'push' 'myStack' 'item1'}}
"topItem": "{{list 'get' 'myStack' -1}}",
"popped": "{{list 'pop' 'myStack'}}",
"rawStack": {{{json (list 'get' 'myStack')}}}`,
    sampleResponse: `{
  "orderId": 101,
  "previousOrder": "ORD-9988",
  "topItem": "item1",
  "popped": "item1",
  "rawStack": ["item1"]
}`,
    tags: ["step-counter", "data-store", "list", "stack", "queue", "set"],
  },
  {
    id: "arithmetic-operators",
    category: "Numeric Math",
    title: "Prefix Notation Arithmetic Operators",
    description:
      "Execute prefix mathematical expressions on static numbers, query parameters, or body values: add, subtract, multiply, divide, modulo, floor, ceil, round, toFixed.",
    syntax: `{
  "totalSum": {{add (body 'price') (body 'tax') 5}},
  "remaining": {{subtract 100 25 10}},
  "volume": {{multiply (body 'qty') (body 'price')}},
  "quotient": {{divide 100 2}},
  "remainder": {{modulo 7 3}},
  "roundedDown": {{floor 3.7}},
  "formattedCurrency": "{{toFixed 123.4567 2}}"
}`,
    sampleResponse: `{
  "totalSum": 115,
  "remaining": 65,
  "volume": 50,
  "quotient": 50,
  "remainder": 1,
  "roundedDown": 3,
  "formattedCurrency": "123.46"
}`,
    tags: ["add", "subtract", "multiply", "divide", "modulo", "toFixed"],
  },
  {
    id: "string-operators",
    category: "String & Array Processing",
    title: "String Operators & Base64 Inline / Block Helpers",
    description:
      "Transform text strings and arrays: lowercase, uppercase, trim, slugify, stripTags, urlEncode, urlDecode, base64 (inline & block forms), padStart, padEnd, split, concat, contains, replace, len.",
    syntax: `{
  "slug": "{{slugify 'some product name'}}",
  "cleanText": "{{stripTags '<greeting>Hello</greeting>'}}",
  "padded": "{{padStart '42' 5 '0'}}",
  "base64Inline": "{{base64 'hello world'}}",
  "base64Block": "{{#base64}}username:password{{/base64}}",
  "arraySplit": [{{split "1;2;3;4" ";"}}],
  "concatenated": "{{concat "Hello" " " "World"}}",
  "isMatch": {{contains "beeceptor-mock-api" "mock"}}
}`,
    sampleResponse: `{
  "slug": "some-product-name",
  "cleanText": "Hello",
  "padded": "00042",
  "base64Inline": "aGVsbG8gd29ybGQ=",
  "base64Block": "dXNlcm5hbWU6cGFzc3dvcmQ=",
  "arraySplit": [1, 2, 3, 4],
  "concatenated": "Hello World",
  "isMatch": true
}`,
    tags: ["slugify", "stripTags", "base64", "padStart", "split", "concat", "contains"],
  },
  {
    id: "array-operators",
    category: "Array Processing & Random Selection",
    title: "Array Operators (sort, reverse, oneOf, someOf)",
    description:
      "Manipulate array collections and random selections. Use sort to order primitive arrays or objects by dot-notation key (asc/desc), reverse to flip items, oneOf to pick a single random item, and someOf to select a random subset.",
    syntax: `{
  "sortedNums": {{{sort (array 5 1 9 2)}}},
  "sortedDesc": {{{sort (array 5 1 9 2) "desc"}}},
  "sortedUsers": {{{sort (body "users") "person.firstName"}}},
  "reversed": {{{reverse (array 1 2 3)}}},
  "randomStatus": "{{oneOf 'draft' 'in-progress' 'approved' 'rejected'}}",
  "randomSubset": {{{someOf (array 'car' 'house' 'boat' 'bike') 1 2 true}}}
}`,
    sampleResponse: `{
  "sortedNums": [1, 2, 5, 9],
  "sortedDesc": [9, 5, 2, 1],
  "sortedUsers": [
    { "person": { "firstName": "Alice" } },
    { "person": { "firstName": "Bob" } }
  ],
  "reversed": [3, 2, 1],
  "randomStatus": "approved",
  "randomSubset": ["bike", "house"]
}`,
    tags: ["sort", "reverse", "oneOf", "someOf", "arrays", "random"],
  },
  {
    id: "comparison-typechecking",
    category: "Comparisons & Type Checking",
    title: "Comparison Operators & Type Checkers (eq, gt, lt, lte, gte, isNumber, isInteger, isDate)",
    description:
      "Perform conditional logic and type validation inside Handlebars blocks. Comparison operators (eq, gt, lt, lte, gte) support numeric & string comparisons. Type checkers (isNumber, isInteger, isDate) return boolean validation states.",
    syntax: `{
  "isCreditScoreGood": {{#if (gt (body 'creditScore') 700)}}"APPROVED"{{else}}"REJECTED"{{/if}},
  "isStageOne": {{#if (eq (body 'stage') 1)}}true{{else}}false{{/if}},
  "isValidNum": {{isNumber '42'}},
  "isValidInt": {{isInteger (body 'count')}},
  "isValidDate": {{isDate (body 'eventDate')}}
}`,
    sampleResponse: `{
  "isCreditScoreGood": "APPROVED",
  "isStageOne": true,
  "isValidNum": true,
  "isValidInt": true,
  "isValidDate": true
}`,
    tags: ["eq", "gt", "lt", "lte", "gte", "isNumber", "isInteger", "isDate"],
  },
  {
    id: "json-jwt-helpers",
    category: "JSON & JWT Processing",
    title: "JSON Parsing & JWT Token Decoders (jsonParse, jwtHeader, jwtPayload, json key path)",
    description:
      "Parse stringified JSON request fields, decode JWT header and payload claims (with optional 'Bearer ' prefix stripping), and extract nested dot-notation fields.",
    syntax: `{
  "parsedUserName": "{{jsonParse (body 'data') 'user.name'}}",
  "jwtAlgorithm": "{{jwtHeader (header 'Authorization') 'alg'}}",
  "jwtSubject": "{{jwtPayload (header 'Authorization') 'sub'}}",
  "nestedKey": {{{json (object nested=(object key1="value1")) 'nested.key1'}}}
}`,
    sampleRequest: `POST /api/test
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.sig
Body: { "data": "{\\"user\\":{\\"name\\":\\"John\\"}}" }`,
    sampleResponse: `{
  "parsedUserName": "John",
  "jwtAlgorithm": "HS256",
  "jwtSubject": "1234567890",
  "nestedKey": "value1"
}`,
    tags: ["jsonParse", "jwtHeader", "jwtPayload", "jwt", "json", "bearer"],
  },
  {
    id: "openapi-protocols",
    category: "OpenAPI & Protocols",
    title: "OpenAPI 3.1 Mock Server & Intelligent Data Generation",
    description:
      "Upload OpenAPI 3.0/3.1 YAML or JSON definitions to activate instant contract-first mock servers. Evaluates requests using a priority matching pipeline (Mock Rules > OpenAPI Spec). Supports Static Placeholder Mode and Intelligent Contextual Data Generation.",
    syntax: `// OpenAPI 3.1 Spec (YAML):
openapi: 3.1.0
info:
  title: Products API
  version: 1.0.0
paths:
  /products/{id}:
    get:
      summary: Get product details by ID
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'`,
    sampleRequest: `GET /api/v1/public/products/e2105e71-22a9-438c-8c10-17d89bc0435a
Header: Accept: application/json`,
    sampleResponse: `// Intelligent Contextual Output (Faker-backed):
{
  "id": "e2105e71-22a9-438c-8c10-17d89bc0435a",
  "name": "Modern Ceramic Tuna",
  "price": 638.69,
  "stock": 478,
  "category": "Electronics",
  "image_url": "https://picsum.photos/seed/product/640/480",
  "created_at": "2024-08-24T00:00:00.0Z"
}`,
    tags: ["openapi", "yaml", "json", "oas31", "protocols", "intelligent-mocking"],
  },
  {
    id: "graphql-server",
    category: "GraphQL & Protocols",
    title: "GraphQL Mock Server (SDL & AI-Powered Synthetic Data)",
    description:
      "Import GraphQL Schema Definition Language (.graphql / .gql) files or paste introspection URLs to generate live GraphQL mock servers. Supports Queries, Mutations (with input variable echo), Subscriptions, Batch Queries, Enums, Non-Null (!), Lists ([]), and custom scalars (DateTime, UUID).",
    syntax: `// GraphQL Query:
query FeaturedPosts {
  posts(featured: true, limit: 2) {
    id
    title
    excerpt
    author {
      name
      avatar
    }
    publishedAt
    viewCount
    tags
  }
}

// Mutation:
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
  }
}`,
    sampleRequest: `POST /api/v1/public/graphql
Header: Content-Type: application/json
Body: { "query": "query { posts { id title author { name } } }" }`,
    sampleResponse: `{
  "data": {
    "posts": [
      {
        "id": "a28f5da2-7a2f-4c23-8e57-85f1d27da4c7",
        "title": "Building Scalable GraphQL APIs",
        "author": {
          "name": "Belinda Ernser",
          "avatar": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/16.jpg"
        },
        "publishedAt": "2025-10-16T14:39:20.728Z",
        "viewCount": 3444,
        "tags": ["technology", "health", "AI"]
      }
    ]
  }
}`,
    tags: ["graphql", "sdl", "queries", "mutations", "subscriptions", "introspection"],
  },
  {
    id: "soap-server",
    category: "SOAP & Protocols",
    title: "SOAP 1.1/1.2 Mock Server (WSDL, 5-Source Matcher, ?wsdl & Faults)",
    description:
      "Import WSDL 1.1 or XML contracts to generate intelligent SOAP mock servers. Matches operations using a 5-source priority matcher (SOAPAction header, Content-Type action, WS-Addressing, SOAP Body root element, URL path). Serves original WSDL contract on ?wsdl requests and simulates <soapenv:Fault> envelopes.",
    syntax: `// SOAP Request Envelope:
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <GetCityWeatherByZIP>
      <ZIP>90210</ZIP>
    </GetCityWeatherByZIP>
  </soapenv:Body>
</soapenv:Envelope>

// Template Expression:
"cityZip": "{{body 'Envelope.Body.GetCityWeatherByZIP.ZIP'}}",
"requestWsdl": "GET /soap-endpoint?wsdl"`,
    sampleRequest: `POST /api/v1/public/soap
Header: SOAPAction: "GetCityWeatherByZIP"
Header: Content-Type: text/xml; charset=utf-8
Body: <soapenv:Envelope><soapenv:Body><GetCityWeatherByZIP><ZIP>90210</ZIP></GetCityWeatherByZIP></soapenv:Body></soapenv:Envelope>`,
    sampleResponse: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <GetCityWeatherByZIPResponse>
      <City>Beverly Hills</City>
      <State>CA</State>
      <Zip>90210</Zip>
      <Temperature>72</Temperature>
    </GetCityWeatherByZIPResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
    tags: ["soap", "wsdl", "soapaction", "faults", "xml", "envelopes"],
  },
  {
    id: "grpc-server",
    category: "gRPC & Protocols",
    title: "gRPC Mock Server (.proto, Reflection, 4 Streaming Modes, google.protobuf.Any)",
    description:
      "Upload .proto files or compiled protoset bundles to generate live gRPC mock implementations. Supports Unary, Server-Streaming, Client-Streaming, and Bidirectional Streaming RPCs. Features Server Reflection enabled by default for grpcurl, Protobuf well-known types (google.protobuf.Timestamp, google.protobuf.Any via @type), and gRPC wire error injection.",
    syntax: `// Protobuf Definition (.proto):
syntax = "proto3";
package paymentservice.v1;

service PaymentService {
  rpc GetProfile (ProfileRequest) returns (ProfileResponse);
  rpc StreamTransactions (TransactionFilter) returns (stream Transaction);
}

// Server Reflection Discovery:
grpcurl my-mock-endpoint.mockbit.io:443 list`,
    sampleRequest: `gRPC Call: paymentservice.v1.PaymentService/GetProfile
Body: { "id": "usr_99" }`,
    sampleResponse: `{
  "name": "Alex Clark",
  "age": 28,
  "createdAt": "2025-05-18T10:23:00Z",
  "details": {
    "@type": "type.googleapis.com/paymentservice.v1.ProfileDetails",
    "merchant_id": "merchant_101",
    "status": "ACTIVE"
  }
}`,
    tags: ["grpc", "proto", "protobuf", "grpcurl", "streaming", "reflection"],
  },
  {
    id: "mtls-server",
    category: "Security & mTLS",
    title: "Mutual TLS (mTLS) Server (PEM Certs, Flexible & Strict Subdomains)",
    description:
      "Enforce Mutual TLS client certificate authentication. Features built-in Certificate Authority (RSA 4096-bit, SHA-256) issuing 1-year PEM client certs. Supports 3 subdomain security modes: Standard SSL (.proxy), Flexible mTLS (.mtls), and Strict mTLS (.rmtls). Tested seamlessly with curl --cert client-cert.pem --key client-key.pem.",
    syntax: `// Standard SSL (Open Access):
https://my-endpoint.proxy.mockbit.io/

// Flexible mTLS (Validates if presented, falls back to TLS):
https://my-endpoint.mtls.mockbit.io/

// Strict mTLS (Mandatory Client Cert Authentication):
https://my-endpoint.rmtls.mockbit.io/`,
    sampleRequest: `curl -v \\
  --cert client-cert.pem \\
  --key client-key.pem \\
  https://my-endpoint.rmtls.mockbit.io/api/v1/public/secure-data`,
    sampleResponse: `{
  "status": "AUTHENTICATED",
  "clientCertificate": {
    "issuer": "Mockbit Internal CA (RSA 4096)",
    "validUntil": "2027-07-24T12:00:00Z",
    "fingerprintSha256": "8f9b...a12c"
  },
  "message": "mTLS handshake verified successfully."
}`,
    tags: ["mtls", "tls", "ssl", "certificates", "pem", "security", "rmtls"],
  },
  {
    id: "mitm-proxy",
    category: "Reverse Proxy & Headers",
    title: "MITM Reverse Proxy & Global Header Injection",
    description:
      "Wrap third-party API domains (e.g. api.stripe.com) to gain full traffic inspection and control. Inject transparent Global Headers (Authorization tokens, X-Trace-Id, CORS Access-Control-Allow-Origin, Set-Cookie), bypass SSL validation errors, and simulate 500/502 server failure code paths.",
    syntax: `// Global Request Header Injection:
Header: Authorization: Bearer secret_live_token
Header: X-Mockbit-Proxy-Mode: true

// Global Response Header Injection (CORS Bypass):
Header: Access-Control-Allow-Origin: *
Header: Access-Control-Allow-Headers: *`,
    sampleRequest: `GET /api/v1/public/stripe-proxy/v1/charges
Header: Host: my-endpoint.proxy.mockbit.io`,
    sampleResponse: `// Response forwarded from api.stripe.com with injected headers:
{
  "object": "list",
  "data": [
    {
      "id": "ch_3Mv1...",
      "object": "charge",
      "amount": 2000,
      "currency": "usd"
    }
  ],
  "_mockbit_proxy": {
    "targetDomain": "https://api.stripe.com",
    "globalHeadersInjected": true,
    "sslVerification": "BYPASSED"
  }
}`,
    tags: ["proxy", "mitm", "cors", "headers", "ssl", "reverse-proxy"],
  },
  {
    id: "local-tunneling",
    category: "Local Tunneling & CLI",
    title: "Local Tunneling Engine (mockbit-cli & CI/CD Non-Interactive Mode)",
    description:
      "Expose localhost web services (e.g. http://localhost:3000) securely to public internet endpoints using mockbit-cli. Supports non-interactive CI/CD execution (-p, -h, --https, --headless, -e, -t). Predefined mock rules automatically evaluate before forwarding requests to local tunnel daemons.",
    syntax: `// NPM Installation:
npx mockbit-cli -p 3000

// Non-Interactive CI/CD Tunneling Command:
mockbit-cli -p 3000 -h 127.0.0.1 -e my-endpoint -t auth_token_991823 --headless`,
    sampleRequest: `POST https://my-endpoint.mockbit.io/webhooks/stripe
Header: X-Mockbit-Tunnel: active`,
    sampleResponse: `// Live response served by local service on localhost:3000:
{
  "received": true,
  "status": "PROCESSED_LOCALLY",
  "timestamp": "2026-07-24T13:38:00Z"
}`,
    tags: ["tunneling", "cli", "localhost", "webhook", "cicd", "headless"],
  },
  {
    id: "unmatched-fallback",
    category: "Fallback Configuration",
    title: "Configurable Default Response for Unmatched Requests (404/501 Custom Fallbacks)",
    description:
      "Configure custom fallback HTTP status codes (e.g. 404 Not Found, 501 Not Implemented), headers, and JSON/XML error bodies when requests fail to match any active Mock Rule or API specification contract. Precedence follows: Mock Rules (1st) > API Specifications (2nd) > Unmatched Fallback (3rd).",
    syntax: `// Studio Settings Configuration:
{
  "unmatchedStatusCode": 404,
  "unmatchedHeaders": {
    "Content-Type": "application/json",
    "X-Mockbit-Fallback": "unmatched_route"
  },
  "unmatchedResponseBody": "{\\"error\\": \\"Route not found in mock specifications.\\"}"
}`,
    sampleRequest: `GET /api/v1/public/unknown-endpoint-path
Header: Accept: application/json`,
    sampleResponse: `HTTP/1.1 404 Not Found
Content-Type: application/json
X-Mockbit-Fallback: unmatched_route

{
  "error": "Route not found in mock specifications.",
  "code": "UNMATCHED_ROUTE_FALLBACK",
  "matchingPipelinePrecedence": ["conditional_rules", "openapi_contract", "unmatched_fallback"]
}`,
    tags: ["unmatched", "fallback", "404", "501", "precedence", "matching-rules"],
  },
  {
    id: "rate-limiting",
    category: "Rate Limiting & Retries",
    title: "Rate Limits & 429 Retry Logic Testing Engine (per sec/min/hr & X-RateLimit Headers)",
    description:
      "Simulate real-world rate-limited third-party APIs to test consumer queue retries and payment gateway backoff logic. Rate limits evaluate before mock rules and support fixed window tracking per second, minute, or hour. Emits standard RFC rate limit headers.",
    syntax: `// Endpoint Rate Limit Configuration:
{
  "rateLimitQuota": 100,
  "rateLimitWindow": "minute", // 'second' | 'minute' | 'hour'
  "exceededStatusCode": 429
}`,
    sampleRequest: `GET /api/v1/public/payment-gateway/charge
Header: Accept: application/json`,
    sampleResponse: `HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1784814000

{
  "error": {
    "code": 429,
    "message": "You have exceeded the rate limit for this API endpoint."
  }
}`,
    tags: ["ratelimit", "429", "retry", "backoff", "headers", "quota"],
  },
  {
    id: "request-history",
    category: "Traffic Audit & HAR Export",
    title: "HTTP Request History & HAR Export (Faceted Search & OpenAPI Drift Detection)",
    description:
      "Inspect 10-day request/response logs with faceted search (URL path, status, headers, query params, body keywords). Export captured traffic to standard HAR (HTTP Archive format) files and automatically detect OpenAPI contract drift using AI comparison.",
    syntax: `// HAR Export Download URL:
GET /api/v1/endpoints/my-endpoint/export/har

// Faceted Traffic Filter:
GET /api/v1/endpoints/my-endpoint/history?status=500&path=/checkout&q=payment_error`,
    sampleRequest: `GET /api/v1/public/checkout/session
Header: X-Mockbit-Trace: audit_log_902`,
    sampleResponse: `{
  "logId": "log_99218274",
  "timestamp": "2026-07-24T13:41:00Z",
  "request": {
    "method": "POST",
    "path": "/checkout/session",
    "headers": { "content-type": "application/json" },
    "clientIp": "192.168.1.45"
  },
  "response": {
    "status": 200,
    "latencyMs": 14,
    "tierExecuted": "conditional_rule"
  },
  "openApiContractDrift": {
    "detected": false,
    "schemaCompliant": true
  }
}`,
    tags: ["history", "har", "audit", "search", "drift-detection", "traffic"],
  },
  {
    id: "white-label",
    category: "Custom Domains & Branding",
    title: "White-Labeled Endpoints (Custom Domains & On-Demand TLS)",
    description:
      "Mask Mockbit identities during customer demos and integration testing by binding custom domains (e.g. api.mycompany.com). Configure CNAME records to whitelabel.mockbit.io with automated DNS propagation verification, Let's Encrypt TLS certificate generation, and dual-domain routing.",
    syntax: `// CNAME DNS Configuration:
Type: CNAME
Name: api (or @ for apex domain)
Value: whitelabel.mockbit.io

// Studio Custom Domain Verification API:
POST /api/v1/endpoints/my-endpoint/custom-domain/verify
Body: { "domain": "api.mycompany.com" }`,
    sampleRequest: `GET https://api.mycompany.com/v1/users
Header: Host: api.mycompany.com`,
    sampleResponse: `{
  "customDomain": "api.mycompany.com",
  "verified": true,
  "tlsCertificate": {
    "issuer": "Let's Encrypt Authority X3",
    "status": "PROVISIONED_ON_DEMAND"
  },
  "data": [
    { "id": "usr_1001", "name": "Sarah Connor" }
  ]
}`,
    tags: ["whitelabel", "cname", "dns", "custom-domain", "tls", "branding"],
  },
  {
    id: "stateful-datastore",
    category: "Stateful Mocks & Storage",
    title: "Stateful Mock Datastore & Visual State Editors (step-counter, data-store, list)",
    description:
      "Simulate persistent state across multiple API calls (Authentication workflows, Shopping Carts POST/GET/DELETE /cart, Multi-step Form Wizards). Supported via step-counter (inc, get, set, reset), data-store (set, get), and list (12 operations: push, pop, shift, unshift, contains, push-unique, get, update, delete, find, size, reset) alongside Studio CRUD & State Inspector UI.",
    syntax: `// Step Counter:
{{step-counter 'inc' 'order_id'}}

// Key-Value Datastore:
{{data-store 'set' 'session_token' (header 'Authorization')}}

// Stateful List (12 Ops):
{{list 'push' 'cart_items' (body 'item_id')}}`,
    sampleRequest: `POST /api/v1/public/cart
Header: Authorization: Bearer sess_9901
Body: { "item_id": "item_prod_42" }`,
    sampleResponse: `{
  "status": "ITEM_ADDED",
  "orderId": {{step-counter 'inc' 'order_id'}},
  "cartItems": {{{list 'get' 'cart_items'}}},
  "itemCount": {{list 'size' 'cart_items'}}
}`,
    tags: ["stateful", "datastore", "step-counter", "data-store", "list", "crud"],
  },
  {
    id: "cors-engine",
    category: "CORS & Security",
    title: "Dynamic CORS Engine & Origin Whitelisting (Access-Control-Allow-Origin & Credentials)",
    description:
      "Simulate Cross-Origin Resource Sharing (CORS) rules for web development. Features default wildcard (*) mode, specific origin whitelisting in Studio Settings, dynamic origin mirroring for credentialed fetch calls (Access-Control-Allow-Credentials: true), and header omission for security testing.",
    syntax: `// Allowed Origins Whitelist Configuration:
[
  "https://dashboard.mycompany.com",
  "https://staging.mycompany.com"
]

// Preflight OPTIONS Request:
OPTIONS /api/v1/public/users
Header: Origin: https://dashboard.mycompany.com
Header: Access-Control-Request-Method: POST`,
    sampleRequest: `OPTIONS /api/v1/public/users
Header: Origin: https://dashboard.mycompany.com
Header: Access-Control-Request-Method: POST`,
    sampleResponse: `HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://dashboard.mycompany.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`,
    tags: ["cors", "origin", "credentials", "options", "preflight", "whitelisting"],
  },
  {
    id: "binary-responses",
    category: "Binary Payload Simulation",
    title: "Binary & File Blob Response Engine (Images, PDFs, Content-Disposition & Gzip)",
    description:
      "Stream binary responses (Images, PDFs, ZIPs, raw buffers up to 10MB) to test client media handling, gzip response compression, and file download flows. Supports automatic MIME detection and custom Content-Disposition header injection.",
    syntax: `// Response Configuration:
{
  "responseType": "binary",
  "contentType": "application/pdf",
  "headers": {
    "Content-Disposition": "attachment; filename=\\"monthly_report.pdf\\"",
    "Content-Encoding": "gzip"
  }
}`,
    sampleRequest: `GET /api/v1/public/download/invoice/inv_9011.pdf
Header: Accept: application/pdf`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice_inv_9011.pdf"
Content-Encoding: gzip
Content-Length: 204857

[Binary Data Buffer - PDF Document]`,
    tags: ["binary", "blob", "pdf", "image", "content-disposition", "gzip", "download"],
  },
  {
    id: "team-rbac",
    category: "Team & Security RBAC",
    title: "Role-Based Team Sharing & Endpoint Collaboration (5 RBAC Roles)",
    description:
      "Invite team members via email with fine-grained Role-Based Access Control (RBAC). Supports 5 permission tiers: Read-Only (traffic log inspection), Write (rules & datastore state editing), Manager (settings & API keys), Owner (single endpoint billing & subscription control), and Organization Admin (domain-wide governance & audit logs).",
    syntax: `// Team Invitation API:
POST /api/v1/endpoints/my-endpoint/members/invite
Body: {
  "email": "developer@mycompany.com",
  "role": "Write" // 'Read-Only' | 'Write' | 'Manager' | 'Owner' | 'OrgAdmin'
}`,
    sampleRequest: `POST /api/v1/endpoints/my-endpoint/members/invite
Header: Authorization: Bearer mgr_token_99`,
    sampleResponse: `{
  "invitationId": "inv_882901",
  "email": "developer@mycompany.com",
  "role": "Write",
  "status": "INVITATION_SENT",
  "permissions": [
    "create_rules",
    "edit_rules",
    "delete_rules",
    "edit_datastore_state",
    "search_history"
  ]
}`,
    tags: ["rbac", "sharing", "team", "permissions", "collaboration", "roles"],
  },
  {
    id: "api-connections",
    category: "OAuth & Outbound Connections",
    title: "API Connections & Outbound OAuth 2.0 Engine (Client Credentials & Callouts)",
    description:
      "Store account-level OAuth 2.0 Client Credentials (Token URL, Client ID, Client Secret, Scope) to automatically authorize outbound HTTP Callout rules. Features automatic token fetching, caching, pre-expiry auto-refresh, customizable header prefixes (Bearer, MAC), and cross-endpoint connection sharing.",
    syntax: `// Account API Connection Configuration:
{
  "name": "Stripe Production Connection",
  "tokenUrl": "https://connect.stripe.com/oauth/token",
  "clientId": "ca_902182",
  "clientSecret": "sk_live_...",
  "headerPrefix": "Bearer",
  "grantType": "client_credentials"
}`,
    sampleRequest: `POST /api/v1/public/trigger-callout
Header: X-Mockbit-Connection: conn_stripe_prod`,
    sampleResponse: `{
  "calloutTriggered": true,
  "outboundRequest": {
    "targetUrl": "https://api.stripe.com/v1/webhooks",
    "authorizationHeader": "Bearer eyJhbGciOiJIUzI1Ni...",
    "oauthTokenStatus": "AUTO_REFRESHED_CACHED"
  }
}`,
    tags: ["oauth", "connections", "client_credentials", "bearer", "callout", "outbound"],
  },
  {
    id: "endpoint-security",
    category: "Endpoint Protection & Auth",
    title: "Mock Server Security & Mandatory Secret Headers (HTTP 562 / 561 Security Gate)",
    description:
      "Protect public mock endpoints from unauthorized usage by enforcing mandatory HTTP authentication headers (e.g. x-mockbit-auth: secret_token_value). Requests lacking valid security headers are rejected automatically with HTTP 562 / 561 before rule matching or quota consumption.",
    syntax: `// Endpoint Security Gate Configuration:
{
  "requireAuthHeader": true,
  "authHeaderKey": "x-mockbit-auth",
  "authSecretValue": "secret_token_val_8829"
}`,
    sampleRequest: `GET /api/v1/public/secure-endpoint
Header: x-mockbit-auth: invalid_secret`,
    sampleResponse: `HTTP/1.1 562 Needs Authorization
Content-Type: text/plain

Needs authorization. Refer to Mockbit endpoint's security settings.`,
    tags: ["security", "auth", "562", "561", "quota-protection", "headers"],
  },
  {
    id: "ai-rules-generator",
    category: "AI Automation & Prompting",
    title: "AI Rules Generator & Natural Language Prompting Engine",
    description:
      "Generate Mock rules, stateful CRUD endpoints, and asynchronous HTTP Callout webhooks using natural language prompts (e.g. 'Create a user registration API that returns success 80% of the time and validation errors 20%'). Generates Handlebars templates, Faker data, conditional logic, and weighted chaos splits as editable drafts.",
    syntax: `// Natural Language Prompt:
"Create a payment processing API that succeeds 80% of the time with a transaction ID, and returns a 422 card_declined error 20% of the time."

// AI-Generated Rule Definition:
{
  "path": "/api/v1/payments",
  "method": "POST",
  "weightedSplit": [
    { "weight": 80, "statusCode": 200, "template": "{\\"status\\":\\"SUCCESS\\", \\"txId\\":\\"{{faker 'string.uuid'}}\\"}" },
    { "weight": 20, "statusCode": 422, "template": "{\\"error\\":\\"card_declined\\", \\"code\\":\\"PAYMENT_FAILED\\"}" }
  ]
}`,
    sampleRequest: `POST /api/v1/public/ai-generate-rule
Body: { "prompt": "Create a user registration API with 80/20 success failure split" }`,
    sampleResponse: `{
  "ruleDraft": {
    "name": "Generated User Registration API",
    "path": "/api/v1/users/register",
    "method": "POST",
    "status": "DRAFT_UNSAVED",
    "weightedResponse": [
      { "weight": 80, "statusCode": 201 },
      { "weight": 20, "statusCode": 400 }
    ]
  }
}`,
    tags: ["ai", "prompting", "natural-language", "rules", "drafts", "chaos"],
  },
  {
    id: "forward-proxy",
    category: "Traffic Interception & Proxying",
    title: "Forward Proxy Engine (HTTP/HTTPS Interception, CA Certs, Playwright & Mobile Proxying)",
    description:
      "Route application & system HTTP/HTTPS traffic through forward-proxy.mockbit.io:8443 for interception, inspection, and mocking. Includes CA root certificate download (mockbit-proxy-ca-com.pem) for HTTPS SSL decryption, Playwright integration (playwright.config.ts), Chrome CLI flags, shell exports, macOS/Android proxy setup, and host-level filtering.",
    syntax: `// Shell Forward Proxy Export:
export http_proxy=http://my-endpoint:pwd_secret901@forward-proxy.mockbit.io:8443
export https_proxy=http://my-endpoint:pwd_secret901@forward-proxy.mockbit.io:8443

// Playwright Config (playwright.config.ts):
use: {
  proxy: {
    server: 'http://forward-proxy.mockbit.io:8443',
    username: 'my-endpoint',
    password: 'pwd_secret901'
  }
}`,
    sampleRequest: `CONNECT echo.free.mockbit.io:443 HTTP/1.1
Header: Proxy-Authorization: Basic bXktZW5kcG9pbnQ6cHdkX3NlY3JldDkwMQ==`,
    sampleResponse: `HTTP/1.1 200 Connection Established

[SSL Tunnel Established - Intercepted & Decrypted Traffic Logged in Studio]`,
    tags: ["forward-proxy", "interception", "ca-cert", "ssl", "playwright", "chrome", "mobile"],
  },
  {
    id: "contract-drift",
    category: "OpenAPI Governance & Drift",
    title: "API Contract Drift Detection & AI OpenAPI Patch Engine (18 Drift Categories & Auto-Merge)",
    description:
      "Monitor live proxy and mock traffic against baseline OpenAPI specifications to automatically catch 18 types of contract drift (schema extra/missing fields, data type mismatches, enum drift, status code drift, undocumented params/headers). Features a Centralized Drift Console, AI-generated OpenAPI spec patches, and real-time drift alert notifications.",
    syntax: `// Baseline OpenAPI Validation API:
POST /api/v1/endpoints/my-endpoint/openapi/validate
Body: { "openApiUrl": "https://api.mycompany.com/openapi.yaml" }

// AI Patch Generation:
POST /api/v1/endpoints/my-endpoint/drift/patch/generate
Body: { "driftId": "drift_882019" }`,
    sampleRequest: `POST /api/v1/public/orders
Header: Content-Type: application/json
Body: { "order_id": "ord_99", "undocumented_field": true }`,
    sampleResponse: `{
  "contractValidation": {
    "compliant": false,
    "driftDetected": true,
    "driftCategory": "request_schema_extra_fields",
    "mismatchDetails": "Field 'undocumented_field' is not defined in OpenAPI spec path /orders",
    "aiPatchAvailable": true
  }
}`,
    tags: ["openapi", "drift", "contract-testing", "patch", "validation", "schema"],
  },
  {
    id: "mcp-server",
    category: "AI Agent & MCP Integration",
    title: "Mockbit MCP Server & Agentic AI Control (Cursor, Claude CLI, Codex & OAuth)",
    description:
      "Connect AI coding assistants directly to Mockbit via Model Context Protocol (MCP HTTP endpoint https://mcp.mockbit.io/mcp). Features OAuth 2.0 PKCE browser authorization and 8 structured agentic tools for rule management, traffic log inspection, state manipulation, endpoint settings, and OpenAPI spec retrieval.",
    syntax: `// Cursor IDE mcpServers Configuration (.cursor/mcp.json):
{
  "mcpServers": {
    "mockbit": {
      "url": "https://mcp.mockbit.io/mcp"
    }
  }
}

// Claude Desktop Configuration (claude_desktop_config.json):
{
  "mcpServers": {
    "mockbit": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.mockbit.io/mcp"]
    }
  }
}`,
    sampleRequest: `POST https://mcp.mockbit.io/mcp
Header: Authorization: Bearer mcp_oauth_tok_99182
Body: { "method": "tools/call", "params": { "name": "manage_rules", "arguments": { "action": "create", "path": "/checkout", "statusCode": 200 } } }`,
    sampleResponse: `{
  "result": {
    "status": "RULE_CREATED",
    "ruleId": "rule_881902",
    "path": "/checkout",
    "message": "Mock rule created successfully via MCP Agentic Mode"
  }
}`,
    tags: ["mcp", "ai-agent", "cursor", "claude", "codex", "oauth", "tools"],
  },
  {
    id: "http-echo",
    category: "Free Online Tools",
    title: "HTTP Echo Service & Request Reflection Tool (JSON Echo & Multipart)",
    description:
      "Instant zero-configuration public HTTP Echo Server (https://echo.free.mockbit.io) that mirrors incoming HTTP requests as formatted JSON objects. Supports GET, POST, PUT, PATCH, DELETE, REST API calls, and multipart/form-data payload inspection for SDK testing and network health checks.",
    syntax: `// cURL Request to Free Echo Endpoint:
curl -X POST https://echo.free.mockbit.io/v1/checkout \\
  -H "Authorization: Bearer token_abc" \\
  -H "Content-Type: application/json" \\
  -d '{"cart_id": "cart_991"}'`,
    sampleRequest: `POST https://echo.free.mockbit.io/v1/checkout
Header: Authorization: Bearer token_abc
Header: Content-Type: application/json
Body: { "cart_id": "cart_991" }`,
    sampleResponse: `{
  "method": "POST",
  "path": "/v1/checkout",
  "headers": {
    "authorization": "Bearer token_abc",
    "content-type": "application/json",
    "user-agent": "curl/7.88.1"
  },
  "query": {},
  "body": {
    "cart_id": "cart_991"
  },
  "clientIp": "192.168.1.100",
  "protocol": "https",
  "timestamp": "2026-07-24T17:17:30Z"
}`,
    tags: ["echo", "free-tool", "json", "reflection", "multipart", "curl", "ping"],
  },
  {
    id: "openapi-test-data",
    category: "OpenAPI Mocking & Data",
    title: "OpenAPI Intelligent Mocking & Field-Level Data Generator Customization UI",
    description:
      "Contextual AI payload generation from OpenAPI field names and descriptions (emails, product names, ISO dates instead of generic 'string' or 0). Studio UI provides field-level property tables, search & pagination, 'Used in APIs' cross-endpoint references, custom Faker/regex overrides, and draft staging with 1-click live commit.",
    syntax: `// Property Generator Customization API:
POST /api/v1/endpoints/my-endpoint/openapi/test-data/override
Body: {
  "property": "user_email",
  "generator": "{{faker 'internet.email'}}",
  "usedInApis": ["/v1/users", "/v1/auth/me", "/v1/orders"]
}`,
    sampleRequest: `GET /api/v1/public/users/usr_99102
Header: Accept: application/json`,
    sampleResponse: `{
  "userId": "usr_99102",
  "userEmail": "sarah.connor@cyberdyne.io",
  "productName": "T-800 Cybernetic Core",
  "createdAt": "2026-07-24T17:18:00.000Z",
  "pricing": 4999.99
}`,
    tags: ["openapi", "intelligent-mocking", "faker", "test-data", "field-generator", "draft-commit"],
  },
  {
    id: "mock-badge",
    category: "Embeddable Badges & Dev Portals",
    title: "\"Mock These APIs\" Embeddable OpenAPI Badge (GitHub README & Dev Portals)",
    description:
      "Help developers test and integrate faster by embedding a 1-click 'Mock These APIs Instantly' badge into GitHub README.md files, Docusaurus, Hugo, Jekyll, or static HTML docs. Automatically downloads remote spec URLs and provisions live mock endpoints powered by 300+ Faker generators.",
    syntax: `// GitHub README Markdown Snippet:
[![Mock These APIs Instantly](https://cdn.mockbit.io/assets/images/buttons/mock-openapi-with-mockbit.png)](https://mockbit.io/openapi-mock-server/?url=https://raw.githubusercontent.com/YOUR-ORG/REPO/main/api.yaml)

// Developer Portal HTML Snippet:
<a href="https://mockbit.io/openapi-mock-server/?url=https://raw.githubusercontent.com/YOUR-ORG/REPO/main/api.yaml" target="_blank">
  <img src="https://cdn.mockbit.io/assets/images/buttons/mock-openapi-with-mockbit.png" alt="Mock These APIs Instantly" style="height: 60px;">
</a>`,
    sampleRequest: `GET https://mockbit.io/openapi-mock-server/?url=https://raw.githubusercontent.com/acme/api/main/swagger.yaml`,
    sampleResponse: `{
  "status": "MOCK_SERVER_PROVISIONED",
  "endpointUrl": "https://acme-api.mockbit.io",
  "totalRoutes": 24,
  "dataGeneratorsLinked": 342,
  "ready": true
}`,
    tags: ["badge", "embed", "github", "readme", "docusaurus", "hugo", "jekyll", "openapi"],
  },
  {
    id: "error-codes-ref",
    category: "Error Codes & Diagnostics",
    title: "Mockbit Diagnostic Error Codes Reference (403, 429, 499, 561-599 Status Codes)",
    description:
      "Comprehensive diagnostic HTTP status codes reference for troubleshooting mock template syntax errors, security gate failures, proxy connectivity timeouts, SSL/TLS handshake failures, and client aborts. Attaches diagnostic X-Mockbit-Execution-Tier tracing headers to all responses.",
    syntax: `// Standard Diagnostic Error Codes Reference:
403: IP Restriction Unauthorized
429: Rate Limit Quota Exceeded
499: Client Aborted Connection
561: Handlebars Response Template Syntax Error
562: Mandatory Auth Header Security Gate Rejected
571-578: Proxy Host / SSL / Timeout / DNS Errors
580-582: Socket Hangup / Blob Fetch Fail / Invalid Target
597/599: System Fallback Errors`,
    sampleRequest: `GET /api/v1/public/test-fault
Header: X-Mockbit-Simulate-Error: 561`,
    sampleResponse: `HTTP/1.1 561 Template Syntax Error
Content-Type: application/json
X-Mockbit-Execution-Tier: diagnostic_error_handler

{
  "error": {
    "code": 561,
    "name": "TEMPLATE_SYNTAX_ERROR",
    "message": "Error parsing Handlebars response template at line 4 column 12",
    "documentation": "https://mockbit.io/docs#error-codes-ref"
  }
}`,
    tags: ["error-codes", "561", "562", "429", "499", "diagnostics", "troubleshooting"],
  },
  {
    id: "enterprise-account",
    category: "Enterprise Security & Governance",
    title: "Enterprise Account Management & Security (SAML 2.0 SSO, OTLP Traces, Header Masking & Billing)",
    description:
      "Enterprise governance suite featuring SAML 2.0 Single Sign-On (Okta, Entra ID, Google Workspace), OpenTelemetry (OTLP) distributed tracing (Datadog, New Relic, Honeycomb), HTTP Header Masking for privacy compliance (Authorization, Cookie, X-Api-Key), SIEM-ready Audit Logs, CIDR IP Whitelisting, and self-service Stripe billing management.",
    syntax: `// SAML 2.0 SSO Identity Provider Config:
{
  "provider": "OKTA", // 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE'
  "ssoUrl": "https://company.okta.com/app/mockbit/sso/saml",
  "issuer": "http://www.okta.com/exk990182",
  "x509Certificate": "-----BEGIN CERTIFICATE-----\\nMII..."
}

// OTLP Observability Exporter Config:
{
  "otlpEndpoint": "https://otlp.datadoghq.com/v1/traces",
  "protocol": "http/protobuf",
  "headers": { "api-key": "dd_key_99" }
}`,
    sampleRequest: `POST /api/v1/auth/saml/callback
Header: Content-Type: application/x-www-form-urlencoded
Body: SAMLResponse=PHNhbWxwOlJlc3BvbnNl...`,
    sampleResponse: `{
  "authenticated": true,
  "user": "admin@mycompany.com",
  "ssoRole": "OrgAdmin",
  "otlpTracingActive": true,
  "maskedHeadersEnabled": ["authorization", "cookie", "x-api-key"]
}`,
    tags: ["enterprise", "sso", "saml", "otlp", "opentelemetry", "header-masking", "billing", "siem"],
  },
  {
    id: "org-management",
    category: "Organization & Multi-Domain Governance",
    title: "Enterprise Organization Management (Domain Auto-Grouping, Readonly Sharing & Multi-Domain Controls)",
    description:
      "Centralized Manage Organization console for Enterprise teams. Features automatic user grouping by corporate email domain (@your-company.com), enforced SAML SSO password sign-up disabling, licensed endpoint creation with change audit tracking, org-wide readonly endpoint sharing, and approved multi-domain sharing allowlists for partners and contractors.",
    syntax: `// Enterprise Organization Configuration:
{
  "orgDomain": "mycompany.com",
  "approvedSharingDomains": ["partner-agency.io", "contractors.dev"],
  "orgWideReadonlySharing": true,
  "ssoEnforcedPasswordDisabled": true,
  "changeAuditDefault": true
}`,
    sampleRequest: `POST /api/v1/org/domains/allowlist
Header: Authorization: Bearer org_admin_token_99
Body: { "domain": "partner-agency.io" }`,
    sampleResponse: `{
  "orgId": "org_cyberdyne_9921",
  "primaryDomain": "mycompany.com",
  "approvedDomains": ["mycompany.com", "partner-agency.io"],
  "totalGroupedUsers": 142,
  "orgReadonlySharingActive": true
}`,
    tags: ["org", "governance", "domains", "allowlist", "enterprise", "audit", "readonly"],
  },
  {
    id: "header-masking",
    category: "Enterprise Security & Privacy",
    title: "Enterprise HTTP Header Masking Engine (Case-Insensitive Token Concealment & Compliance)",
    description:
      "Prevent sensitive token leakage across logs, history searches, and console displays by configuring case-insensitive HTTP header masking rules in Organization Settings. Conceals sensitive credentials (e.g. Authorization, Cookie, X-Api-Key) to ensure compliance with GDPR, SOC2, and HIPAA regulations.",
    syntax: `// Organization Header Masking Rule Configuration:
{
  "maskedHeaders": [
    "authorization",
    "cookie",
    "x-api-key",
    "x-session-id"
  ],
  "caseInsensitive": true,
  "maskReplacement": "Bearer ********"
}`,
    sampleRequest: `POST /api/v1/public/secure-data
Header: Authorization: Bearer secret_jwt_token_991823
Header: Cookie: session=sess_abc123secret`,
    sampleResponse: `{
  "requestLogConcealed": true,
  "maskedHeaders": {
    "authorization": "Bearer ********",
    "cookie": "session=********"
  },
  "complianceAudited": true
}`,
    tags: ["header-masking", "security", "privacy", "gdpr", "soc2", "enterprise", "redaction"],
  },
  {
    id: "ip-whitelisting",
    category: "Enterprise Security & Firewall",
    title: "Enterprise IP Whitelisting & CIDR Access Control (HTTP 403 Unauthorized IP Rejection)",
    description:
      "Restrict mock server access to approved IP addresses or CIDR blocks (e.g. 192.168.1.0/24, 10.0.4.12) configured in Organization Settings. Connection attempts from unapproved IPs are terminated immediately with HTTP 403 Forbidden - Unauthorized IP while maintaining secure management console access for Org Admins.",
    syntax: `// Organization IP Whitelist Configuration:
{
  "ipWhitelistEnabled": true,
  "allowedCidrRanges": [
    "192.168.1.0/24",
    "10.0.4.12/32",
    "203.0.113.45/32"
  ]
}`,
    sampleRequest: `GET /api/v1/public/payment-methods
Header: X-Forwarded-For: 198.51.100.99`,
    sampleResponse: `HTTP/1.1 403 Forbidden
Content-Type: application/json
X-Mockbit-Execution-Tier: ip_firewall_gate

{
  "error": {
    "code": 403,
    "name": "UNAUTHORIZED_IP_ADDRESS",
    "message": "Access denied: Request originated from unapproved IP address 198.51.100.99."
  }
}`,
    tags: ["ip-whitelist", "cidr", "firewall", "security", "403", "enterprise", "access-control"],
  },
  {
    id: "audit-logs",
    category: "Enterprise Audit & SIEM",
    title: "Audit Logs & Configuration Change Tracking (Time-Stamped History & Event Filtering)",
    description:
      "Time-stamped audit trail tracking who made a configuration change, what rule or setting was modified, and when it occurred. Access is restricted to Manager, Owner, and Org Admin roles. Features multi-criteria event filtering by timestamp range, event type, rule ID, or user email with SIEM exporter integration.",
    syntax: `// Audit Logs Search API:
GET /api/v1/endpoints/my-endpoint/audit-logs?eventType=rule_updated&user=dev@mycompany.com

// Audit Event Payload Structure:
{
  "eventId": "evt_991823",
  "timestamp": "2026-07-24T17:26:00Z",
  "userEmail": "dev@mycompany.com",
  "userRole": "Manager",
  "eventType": "RULE_UPDATED",
  "targetRuleId": "rule_8819",
  "diff": {
    "before": { "statusCode": 200 },
    "after": { "statusCode": 500 }
  }
}`,
    sampleRequest: `GET /api/v1/endpoints/my-endpoint/audit-logs?limit=10
Header: Authorization: Bearer mgr_token_99`,
    sampleResponse: `{
  "auditEvents": [
    {
      "eventId": "evt_991823",
      "timestamp": "2026-07-24T17:26:00Z",
      "userEmail": "developer@mycompany.com",
      "eventType": "RULE_UPDATED",
      "ruleId": "rule_8819",
      "description": "Updated rule path /checkout status code to 500"
    }
  ],
  "totalCount": 142
}`,
    tags: ["audit-logs", "history", "compliance", "siem", "change-tracking", "governance"],
  },
  {
    id: "otlp-observability",
    category: "Observability & APM",
    title: "OpenTelemetry (OTLP) Distributed Tracing Engine (Jaeger, Datadog, Grafana & Honeycomb)",
    description:
      "Export distributed traces over HTTP OTLP (/v1/traces) to your APM platform (Jaeger, Grafana Tempo, Datadog, New Relic, Honeycomb, Lightstep). Emits root span mock.request (service.name: mockbit-mock, duration, status, payload sizes) and child spans (rule.evaluation, proxy.upstream, tunnel.upstream).",
    syntax: `// Organization OTLP Exporter Configuration:
{
  "otlpEnabled": true,
  "endpointUrl": "https://otlp.datadoghq.com/v1/traces",
  "headers": {
    "DD-API-KEY": "dd_key_secret_99128"
  }
}`,
    sampleRequest: `GET /api/v1/public/payment/charge
Header: traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`,
    sampleResponse: `{
  "otlpTraceEmitted": true,
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "rootSpan": "mock.request",
  "childSpans": ["rule.evaluation", "proxy.upstream"],
  "serviceName": "mockbit-mock"
}`,
    tags: ["otlp", "opentelemetry", "tracing", "datadog", "grafana", "honeycomb", "apm", "jaeger"],
  },
  {
    id: "saml-sso",
    category: "Enterprise Identity & Auth",
    title: "SAML 2.0 Single Sign-On (Microsoft Entra ID, Google Workspace & Okta IdP/SP Login)",
    description:
      "Delegate enterprise authentication to Microsoft Entra ID (Azure AD), Google Workspace Directory, or Okta via SAML 2.0 protocol. Supports IdP-initiated app launcher logins, SP-initiated login at https://mockbit.io/auth/sso, signed assertions, custom claim mappings, and Just-In-Time (JIT) user auto-provisioning.",
    syntax: `// Service Provider SAML 2.0 Settings:
Entity ID (Identifier): mockbit.io
ACS URL (Assertion Consumer): https://mockbit.io/auth/identity-provider/callback
Signing Option: Sign SAML Response and Assertion

// Required Attribute Mappings:
Microsoft Entra ID: Unique User Identifier -> user.mail, displayName -> user.displayname
Google Workspace: Primary Email -> email, First Name -> firstName, Last Name -> lastName`,
    sampleRequest: `POST /auth/identity-provider/callback
Header: Content-Type: application/x-www-form-urlencoded
Body: SAMLResponse=PHNhbWxwOlJlc3BvbnNl...`,
    sampleResponse: `{
  "authenticated": true,
  "user": {
    "email": "sarah@cyberdyne.com",
    "displayName": "Sarah Connor",
    "organization": "Cyberdyne Systems",
    "jitProvisioned": true
  },
  "sessionToken": "saml_sess_99182312"
}`,
    tags: ["saml", "sso", "entra-id", "azure-ad", "google-workspace", "okta", "jit-provisioning", "enterprise"],
  },
  {
    id: "management-api",
    category: "REST Management API",
    title: "Mockbit REST Management APIs & OpenAPI 3.0 Spec (Programmatic Automation & Bearer Auth)",
    description:
      "Programmatically configure, inspect, and automate mock servers, declarative rules, Handlebars templates, stateful CRUD datastores, atomic counters, and outbound callouts via REST APIs. Authenticated via Authorization: Bearer <API_KEY> headers with complete OpenAPI 3.0 specification available at https://mockbit.io/api/v1/openapi.json.",
    syntax: `// Create Mock Rule via REST API:
POST /api/v1/endpoints/my-endpoint/rules
Header: Authorization: Bearer mockbit_sec_token_99182
Body: {
  "name": "Simulate Checkout Timeout",
  "priority": 1,
  "conditions": [{ "field": "path", "operator": "equals", "value": "/v1/checkout" }],
  "response": { "statusCode": 504, "body": { "error": "Gateway Timeout" }, "delayMs": 2500 }
}`,
    sampleRequest: `GET /api/v1/openapi.json
Header: Authorization: Bearer mockbit_sec_token_99182`,
    sampleResponse: `{
  "openapi": "3.0.3",
  "info": {
    "title": "Mockbit Mock Server Management API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/v1/endpoints": { "get": {}, "post": {} },
    "/api/v1/endpoints/{id}/rules": { "get": {}, "post": {} },
    "/api/v1/endpoints/{id}/datastore": { "get": {}, "post": {} }
  }
}`,
    tags: ["api", "rest", "openapi", "bearer-auth", "automation", "rules-api", "datastore-api"],
  },
  {
    id: "sample-apis",
    category: "Free Pre-Built Public APIs",
    title: "Pre-Built Public Sample APIs for Testing (Free CORS Endpoints & Custom Prototyping)",
    description:
      "Instant zero-configuration hosted, CORS-enabled public sample APIs for frontend prototyping, mobile app testing, and CI/CD scripts. Includes 7 pre-built domain datasets: Users, Companies, Todos, Blog Posts, Geography, E-Commerce, and Crypto Wallets on https://fake-json.free.mockbit.io with on-the-fly failure (?status=401) and delay (?delay=2000) simulation.",
    syntax: `// Ready-to-Use Public Sample API Endpoints:
GET https://fake-json.free.mockbit.io/users
GET https://fake-json.free.mockbit.io/companies
GET https://dummy-json.free.mockbit.io/todos
GET https://dummy-json.free.mockbit.io/posts
GET https://dummy-json.free.mockbit.io/continents
GET https://fake-store.free.mockbit.io/products
GET https://crypto-wallet.free.mockbit.io/wallets

// Simulate Status & Delay via Query Params:
GET https://fake-json.free.mockbit.io/users?status=401&delay=1500`,
    sampleRequest: `GET https://fake-json.free.mockbit.io/users?limit=2
Header: Accept: application/json`,
    sampleResponse: `[
  {
    "id": "usr_101",
    "name": "Sarah Connor",
    "email": "sarah.connor@cyberdyne.io",
    "avatar": "https://cdn.mockbit.io/avatars/usr_101.jpg",
    "role": "Lead Engineer"
  },
  {
    "id": "usr_102",
    "name": "John Connor",
    "email": "john.connor@resistance.net",
    "avatar": "https://cdn.mockbit.io/avatars/usr_102.jpg",
    "role": "Security Specialist"
  }
]`,
    tags: ["sample-api", "dummy-json", "cors", "free", "users", "ecommerce", "crypto", "todos"],
  },
  {
    id: "importance-of-mocking",
    category: "Architecture & Best Practices",
    title: "The Importance of Setting Up An API Mock Server (Parallel Development & Zero-Dependency Prototyping)",
    description:
      "Unblock engineering teams when backend APIs are unbuilt, 3rd-party sandboxes return 500 errors, or VPN connections drop. API mocking enables independent parallel development, early edge-case testing, rapid contract feedback, zero-cost infrastructure setup, automatic preflight CORS (OPTIONS) handling, and fast engineer onboarding.",
    syntax: `// JavaScript fetch() Request Example:
fetch("https://try-project.mockbit.io/todos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Build parallel UI screen", completed: false })
})
  .then(res => res.json())
  .then(data => console.log("Mock API Response:", data));`,
    sampleRequest: `POST https://try-project.mockbit.io/todos
Header: Content-Type: application/json
Body: { "title": "Build parallel UI screen", "completed": false }`,
    sampleResponse: `{
  "id": "todo_99182",
  "title": "Build parallel UI screen",
  "completed": false,
  "createdAt": "2026-07-24T17:44:00.000Z",
  "status": "CREATED"
}`,
    tags: ["mocking-guide", "parallel-dev", "best-practices", "cors", "fetch", "unblock", "architecture"],
  },
  {
    id: "sendgrid-virtualization",
    category: "Service Virtualization & Integrations",
    title: "Service Virtualization for SendGrid APIs (Record & Mock Transactional Email Services)",
    description:
      "Virtualize external transactional email services (SendGrid /v3/mail/send) to test email triggers, CC recipient validation, SDK base URL overrides, downstream outages (500 errors), and 10-second delivery latencies without triggering actual email sends or incurring API fees.",
    syntax: `// SendGrid Node.js SDK Base URL Override:
const sendGrid = require('@sendgrid/mail');
sendGrid.setApiKey(process.env.SENDGRID_API_KEY || 'SG.mock_key');
if (process.env.SENDGRID_API_MOCK_DOMAIN) {
  sendGrid.client.setDefaultRequest('baseUrl', process.env.SENDGRID_API_MOCK_DOMAIN);
}
// sendGrid.send(msg) now hits Mockbit mock endpoint!`,
    sampleRequest: `POST /v3/mail/send
Header: Authorization: Bearer SG.mock_key_99
Body: { "personalizations": [{ "to": [{ "email": "test@domain.com" }] }], "subject": "Test Email" }`,
    sampleResponse: `HTTP/1.1 202 Accepted
Content-Type: application/json
X-Mockbit-Execution-Tier: service_virtualization

{
  "status": "ACCEPTED",
  "messageId": "msg_sendgrid_mock_991823",
  "simulatedDelayMs": 1000
}`,
    tags: ["sendgrid", "service-virtualization", "email", "proxy-recorder", "sdk-override", "testing"],
  },
  {
    id: "timeout-simulation",
    category: "Resilience & Chaos Testing",
    title: "Simulate TCP Connection & Response Timeout Errors (Artificial Delays & Socket Timeouts)",
    description:
      "Test how client applications handle network latency, TCP connection timeouts, and socket read timeouts. Configure rules with 60-second response delays or use per-request query params (?delay=60000) to trigger client socket timeout exceptions (java.net.SocketTimeoutException, ETIMEDOUT) and verify UI freezing, retry logic, and thread pool cleanup.",
    syntax: `// Configure Rule Delay or Request Query Parameter:
GET /api/v1/public/checkout?delay=60000
Header: X-Mockbit-Delay: 60000

// Rule Response Definition:
{
  "name": "Simulate 60s Socket Read Timeout",
  "delayMs": 60000,
  "response": { "statusCode": 504, "body": { "error": "Gateway Timeout" } }
}`,
    sampleRequest: `GET /api/v1/public/checkout?delay=60000
Header: Accept: application/json`,
    sampleResponse: `// Client-side socket exception triggered after 30s/60s:
java.net.SocketTimeoutException: Read timed out
  at java.net.SocketInputStream.socketRead0(Native Method)
  at java.net.SocketInputStream.read(SocketInputStream.java:152)`,
    tags: ["timeout", "socket-timeout", "latency", "chaos", "resilience", "delay", "etimedout"],
  },
  {
    id: "webhook-testing",
    category: "Webhooks & Local Tunneling",
    title: "Webhook Development & Testing (Asynchronous Push Event Receiver & Local Tunneling)",
    description:
      "Inspect and test asynchronous push webhook notifications from 3rd-party SaaS platforms (Stripe, GitHub, Shopify, Twilio). Features live header and signature verification inspection (Stripe-Signature, X-Hub-Signature-256), instant HTTP 200 OK acknowledgements, and Local Tunnel CLI (npx mockbit tunnel 3000) to route public webhooks directly to localhost.",
    syntax: `// Start Local Tunnel CLI to route webhooks to local dev port:
npx mockbit tunnel 3000 --subdomain my-webhook-receiver

// Incoming Webhook Headers & Verification Inspection:
POST /webhooks/stripe
Header: Stripe-Signature: t=1680000000,v1=991823abc...
Header: Content-Type: application/json`,
    sampleRequest: `POST /webhooks/stripe
Header: Stripe-Signature: t=1680000000,v1=991823abc...
Body: { "type": "payment_intent.succeeded", "data": { "object": { "amount": 2999 } } }`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Tunnel-Status: forwarded_to_localhost_3000

{
  "received": true,
  "eventType": "payment_intent.succeeded",
  "localForwardingPort": 3000
}`,
    tags: ["webhook", "tunnel", "stripe", "github", "shopify", "push", "event-driven", "localhost"],
  },
  {
    id: "layer7-chaos",
    category: "Resilience & Chaos Engineering",
    title: "Layer 7 Chaos Engineering & Circuit Breaker Testing (Fault Injection & Staging Decoupling)",
    description:
      "Decouple test suites from staging environment drift by injecting application-layer faults. Simulate 30s delays to test thread pool exhaustion, 504 Gateway Timeouts, 503 Maintenance states, 429 Rate Limits with Retry-After, Database Deadlocks (HTTP 409 / ORA-00060), and validate Circuit Breaker state transitions (Closed -> Open -> Half-Open -> Closed).",
    syntax: `// Inject Database Deadlock Fault via API:
POST /api/v1/endpoints/my-endpoint/rules
Header: Authorization: Bearer token_99182
Body: {
  "name": "Simulate Oracle DB Deadlock",
  "conditions": [{ "field": "path", "operator": "equals", "value": "/v1/orders/checkout" }],
  "response": {
    "statusCode": 500,
    "headers": { "Retry-After": "5" },
    "body": { "error": "ORA-00060: deadlock detected while waiting for resource" }
  }
}`,
    sampleRequest: `POST /api/v1/orders/checkout
Header: Accept: application/json`,
    sampleResponse: `HTTP/1.1 500 Internal Server Error
Content-Type: application/json
Retry-After: 5
X-Mockbit-Execution-Tier: chaos_fault_injection

{
  "error": "ORA-00060: deadlock detected while waiting for resource",
  "circuitBreakerTripped": true,
  "state": "OPEN"
}`,
    tags: ["chaos", "fault-injection", "circuit-breaker", "deadlock", "504", "503", "429", "resilience"],
  },
  {
    id: "webhook-architecture",
    category: "Architecture & System Patterns",
    title: "Enterprise Webhook System Architecture & Design Patterns (Pub/Sub, HMAC Signatures & Fan-Out Engine)",
    description:
      "Architectural blueprint for building scalable, developer-friendly webhook systems. Details Pub/Sub decoupling with message queues (Kafka, RabbitMQ, SQS), HMAC SHA256 signature verification (Stripe-Signature, X-Hub-Signature-256), exponential backoff retries (retrying 5xx, skipping 4xx), idempotency (eventId tokens), APM delivery metrics, and multi-endpoint fan-out routing.",
    syntax: `// HMAC SHA256 Webhook Signature Header Generation:
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex');
// Header: X-Hub-Signature-256: sha256=99182abc...

// Webhook Event Structure with Idempotency Token:
{
  "eventId": "evt_99182312",
  "eventType": "payment_intent.succeeded",
  "timestamp": "2026-07-24T17:48:00Z",
  "payload": { "id": "pi_881", "amount": 4999 }
}`,
    sampleRequest: `POST /api/v1/endpoints/my-endpoint/webhooks/trigger-test
Header: Authorization: Bearer token_99182
Body: { "targetUrl": "https://consumer.company.com/webhook", "eventType": "user.created" }`,
    sampleResponse: `{
  "delivered": true,
  "statusCode": 200,
  "deliveryLatencyMs": 42,
  "hmacSigned": true,
  "signatureHeader": "sha256=a881920bc9182...",
  "retryCount": 0
}`,
    tags: ["webhook", "architecture", "pubsub", "hmac", "fan-out", "idempotency", "retries", "apm"],
  },
  {
    id: "load-testing",
    category: "Performance & SDET Testing",
    title: "Mocking External Services During Load Testing (SDET Performance Testing & High-Concurrency Mocks)",
    description:
      "Isolate target microservices during high-concurrency load testing by replacing expensive 3rd-party dependencies with hosted mock servers. Features traffic Record & Replay, predictable fixed response latencies (500ms fixed delays), dynamic unique payload generation ({{faker 'string.uuid'}}), and automated CI/CD pipeline setup/teardown via REST APIs.",
    syntax: `// Programmatic High-Concurrency Mock Rule Setup for Load Testing:
POST /api/v1/endpoints/my-endpoint/rules
Header: Authorization: Bearer token_99182
Body: {
  "name": "Load Test Mock - Fixed 500ms Latency",
  "delayMs": 500,
  "response": {
    "statusCode": 200,
    "body": {
      "transactionId": "{{faker 'string.uuid'}}",
      "status": "APPROVED",
      "processedAt": "{{isoTimestamp}}"
    }
  }
}`,
    sampleRequest: `POST /v1/payments/process
Header: Content-Type: application/json
Body: { "amount": 99.99, "currency": "USD" }`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Execution-Tier: load_test_mock_server

{
  "transactionId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "APPROVED",
  "processedAt": "2026-07-24T17:49:00.000Z"
}`,
    tags: ["load-testing", "sdet", "performance", "high-concurrency", "predictable-latency", "faker", "cicd"],
  },
  {
    id: "port-forwarding",
    category: "Networking & Local Tunnels",
    title: "Layer 7 HTTPS Port Forwarding & Local Tunneling (NAT & Firewall Bypass over Port 443)",
    description:
      "Bypass complex router configurations, public IP management, and corporate IT firewall rules by establishing a secure Layer 7 HTTPS tunnel over Port 443. Run npx mockbit tunnel 8080 to expose local HTTP services behind NATs to the public internet for rapid API contract fixes, cross-device mobile testing, live product demos, and webhook development.",
    syntax: `// Start Layer 7 Local Tunnel CLI:
npx mockbit tunnel 8080 --subdomain my-local-service

// Access exposed local service publicly over HTTPS:
https://my-local-service.mockbit.io -> localhost:8080`,
    sampleRequest: `GET https://my-local-service.mockbit.io/api/v1/health
Header: User-Agent: MobileApp/2.4.0 (iOS)`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Tunnel-Transport: L7_HTTPS_Port_443

{
  "service": "Local Node.js Server",
  "status": "HEALTHY",
  "localPort": 8080,
  "forwardedVia": "https://my-local-service.mockbit.io"
}`,
    tags: ["port-forwarding", "l7", "https", "tunnel", "nat-bypass", "firewall", "localhost", "mobile-testing"],
  },
  {
    id: "android-proxy-inspection",
    category: "Mobile & Device Testing",
    title: "Inspecting API Traffic On Android Apps (Mobile HTTP Proxy & BuildConfig Overrides)",
    description:
      "Intercept, monitor, and manipulate HTTP/HTTPS API traffic originating from Android emulators or physical mobile devices. Configure Android BuildConfig.BASE_URL to point to a Mockbit proxy endpoint to stream real-time network calls, test 3G/4G latencies, simulate 500 errors for UI loader spinners, and audit headers for sensitive token leaks.",
    syntax: `// Android Kotlin BuildConfig setup (build.gradle.kts):
buildTypes {
  debug {
    buildConfigField("String", "BASE_URL", "\"https://android-proxy.mockbit.io\"")
  }
}

// Android OkHttpClient Initialization:
val client = OkHttpClient.Builder()
  .connectTimeout(30, TimeUnit.SECONDS)
  .build()`,
    sampleRequest: `POST https://android-proxy.mockbit.io/api/v2/user/login
Header: User-Agent: MockbitApp/3.1.0 (Android 14; Pixel 8 Pro)
Body: { "username": "dev_tester", "deviceId": "android_uuid_9918" }`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Execution-Tier: mobile_proxy_interceptor

{
  "status": "AUTHENTICATED",
  "token": "bearer_mobile_mock_token_991823",
  "simulatedNetwork": "3G_SLOW_LATENCY_800MS"
}`,
    tags: ["android", "mobile", "proxy", "buildconfig", "okhttp", "latency", "inspection", "security-audit"],
  },
  {
    id: "slow-api-latency",
    category: "Resilience & Latency Simulation",
    title: "Simulating Slow APIs During Development (API Latency Simulation & Network Throttling)",
    description:
      "Simulate high API latencies and 2G/3G network throttling during QA and SDET testing. Test web and mobile app loading indicators, uncover frontend asynchronous race conditions in shared state, inject additive delays on live proxied backend endpoints, and override latencies per request via ?delay=2000 or X-Mockbit-Delay headers.",
    syntax: `// Overrides via HTTP Query Parameter or Request Header:
GET /api/v1/feed?delay=2500
Header: X-Mockbit-Delay: 2500

// Rule Response Definition with Proxy Additive Delay:
{
  "name": "Simulate 3G Mobile Latency",
  "delayMs": 2500,
  "proxyTarget": "https://api.production-backend.com"
}`,
    sampleRequest: `GET /api/v1/feed?delay=2500
Header: Accept: application/json`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Latency-Simulated: 2500ms
X-Mockbit-Execution-Tier: additive_proxy_latency

{
  "items": [{ "id": 1, "title": "Slow Network Post" }],
  "simulatedNetworkProfile": "3G_SLOW_BANDWIDTH"
}`,
    tags: ["latency", "slow-api", "network-throttling", "race-conditions", "loader-ui", "proxy-delay"],
  },
  {
    id: "rate-limits-testing-guide",
    category: "Rate Limiting & Retries",
    title: "Simulate API Rate Limits (5 Testing Strategies, Standard RFC Headers & Throttled Mocks)",
    description:
      "Comprehensive SDET guide for testing rate-limited 3rd-party APIs. Master 5 key testing strategies: header inspection (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset), real-world traffic spike simulation, HTTP 429 edge-case validation, exponential backoff retries with Retry-After adherence, and zero-cost mock throttling.",
    syntax: `// Endpoint Rate Limit Configuration in Studio:
{
  "endpointId": "ep_payment_gateway",
  "rateLimitQuota": 100,
  "rateLimitWindow": "minute",
  "exceededStatusCode": 429
}`,
    sampleRequest: `POST /api/v1/payments/charge
Header: Authorization: Bearer token_rate_test_99`,
    sampleResponse: `HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1784814000
Retry-After: 60

{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}`,
    tags: ["ratelimit", "429", "retry-after", "backoff", "throttling", "headers", "sdet", "strategies"],
  },
  {
    id: "react-todo-tutorial",
    category: "Tutorials & Prototyping",
    title: "React ToDo App Tutorial (Prototyping Frontend Apps with Mock APIs & Live XHR Inspection)",
    description:
      "Step-by-step tutorial for building a React To-Do application using Mockbit hosted mock endpoints. Learn to initialize projects, integrate Axios for GET/POST calls to /todos, inspect real-time XHR request payloads on the Studio console, and master advanced prototyping (auth simulation, CRUD methods, pagination, and 500 error resilience).",
    syntax: `// TaskList.jsx - Fetching tasks from Mockbit mock endpoint:
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    axios.get('https://my-todo-app.mockbit.io/todos')
      .then(res => setTasks(res.data));
  }, []);
  return <ul>{tasks.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
};`,
    sampleRequest: `POST https://my-todo-app.mockbit.io/todos
Header: Content-Type: application/json
Body: { "title": "Build React Prototyping Screen" }`,
    sampleResponse: `HTTP/1.1 201 Created
Content-Type: application/json
X-Mockbit-Execution-Tier: react_prototyping_mock

{
  "id": "todo_react_99182",
  "title": "Build React Prototyping Screen",
  "completed": false,
  "createdAt": "2026-07-24T17:54:00.000Z"
}`,
    tags: ["react", "tutorial", "prototyping", "axios", "todo-app", "xhr", "crud", "frontend"],
  },
  {
    id: "csv-data-generator",
    category: "Data Generation & Downloads",
    title: "Generate Dummy Data in CSV (Dynamic CSV File Generation & Browser Download Headers)",
    description:
      "Generate random comma-separated user profiles and tabular datasets using dynamic Faker.js constructs. Configure response headers (Content-Type: text/csv, Content-Disposition: attachment; filename=\"userprofiles.csv\") to force immediate browser CSV downloads for frontend testing, data ingestion scripts, and mock exports.",
    syntax: `// CSV Response Body Template in Studio:
username,firstName,lastName,email,country,signUpAddress,signUpTimestamp
{{faker 'internet.userName'}},{{faker 'person.firstName'}},{{faker 'person.lastName'}},{{faker 'internet.email'}},{{faker 'location.country'}},{{faker 'location.streetAddress'}},{{faker 'date.past'}}

// Response Headers:
Content-Type: text/csv
Content-Disposition: attachment; filename="userprofiles.csv"`,
    sampleRequest: `GET /api/v1/export/users.csv
Header: Accept: text/csv`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="userprofiles.csv"
X-Mockbit-Execution-Tier: dynamic_template_csv

username,firstName,lastName,email,country,signUpAddress,signUpTimestamp
alex99,Alex,Morgan,alex.m@example.com,United States,742 Evergreen Terrace,2025-11-12T08:30:00Z
dev_sarah,Sarah,Chen,sarah.c@example.com,Canada,100 King St W,2026-02-14T14:15:00Z`,
    tags: ["csv", "faker", "download", "content-disposition", "export", "dummy-data", "tabular"],
  },
  {
    id: "selective-proxy-mocking",
    category: "QA Pipeline & Staging Isolation",
    title: "Selective Proxy Mocking for Broken Staging Services (QA Pipeline Isolation & Selective Rule Toggling)",
    description:
      "Prevent an unstable downstream service (e.g. Fraud returning 40% false-positive 500s) from halting your 15+ microservice CI/CD release pipeline. Route traffic through a Mockbit proxy URL (https://fraud.proxy.mockbit.io), keep mocks disabled by default for real integration testing, and flip a single toggle in Studio to isolate only the broken service with stateful mocks.",
    syntax: `// Toggle Selective Rule Mocking via API:
PATCH /api/v1/endpoints/fraud-proxy/rules/rule_99182/toggle
Header: Authorization: Bearer token_qa_pipeline_88
Body: { "enabled": true }

// Reverse Proxy Fallback Execution Header:
X-Mockbit-Proxy-Mode: selective_rule_fallback
X-Mockbit-Target-Upstream: https://staging-fraud-service.internal`,
    sampleRequest: `POST https://fraud.proxy.mockbit.io/v1/fraud/evaluate
Header: Content-Type: application/json
Body: { "orderId": "ord_991823", "amount": 250.00 }`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Execution-Tier: selective_proxy_fallback

{
  "orderId": "ord_991823",
  "status": "APPROVED",
  "reviewScore": 0.02,
  "isolatedDependency": "fraud_service",
  "proxyTargetStatus": "TEMPORARILY_MOCKED"
}`,
    tags: ["selective-mocking", "proxy", "qa-pipeline", "staging-isolation", "rule-toggling", "ci-cd", "stateful"],
  },
  {
    id: "cors-resolution-guide",
    category: "CORS & Security",
    title: "How to Solve CORS Issues or Bypass It for Development (CORS Preflight OPTIONS & Reverse Proxying)",
    description:
      "Understand Cross-Origin Resource Sharing (CORS) security checkpoints between frontend apps (app.domain-a.com) and APIs (api.domain-b.com). Learn to inspect OPTIONS preflight requests in Chrome DevTools (Access-Control-Request-Method/Headers), whitelist backend origins, or bypass CORS during development using Mockbit's automatic header injection proxy.",
    syntax: `// OPTIONS Preflight Interception & Response Headers:
OPTIONS /v1/checkout
Header: Origin: https://frontend-app.company.com
Header: Access-Control-Request-Method: POST
Header: Access-Control-Request-Headers: Authorization, Content-Type`,
    sampleRequest: `OPTIONS /v1/checkout
Header: Origin: https://frontend-app.company.com
Header: Access-Control-Request-Method: POST`,
    sampleResponse: `HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://frontend-app.company.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With
X-Mockbit-CORS-Status: AUTOMATICALLY_NEUTRALIZED`,
    tags: ["cors", "preflight", "options", "access-control-allow-origin", "bypass", "proxy", "security"],
  },
  {
    id: "partial-mocks-guide",
    category: "Frontend Integrations & Prototyping",
    title: "Speed Up Frontend Integrations With Partial Mocks (Hybrid HTTP Proxy & Incremental API Mocking)",
    description:
      "Accelerate frontend feature velocity by combining live backend API data with selective mocks. Route application base URLs through a Mockbit proxy endpoint (https://partial-mock.mockbit.io) to forward existing endpoints to live sandbox/production backends while selectively mocking unbuilt or breaking routes.",
    syntax: `// Proxy Configuration with Selective Route Mocking:
Proxy Base Target: https://dog.ceo/api
Mock Endpoint: https://partial-mock.mockbit.io

// Selective Mock Rule Definition for Unbuilt Route:
GET /breeds/list/new-experimental-feature
Response: { "status": "success", "message": ["retriever", "golden"] }`,
    sampleRequest: `GET https://partial-mock.mockbit.io/breeds/list/all
Header: Accept: application/json`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Proxy-Status: FORWARDED_TO_LIVE_BACKEND
X-Mockbit-Execution-Tier: reverse_proxy_pass_through

{
  "message": { "bulldog": ["boston", "english", "french"], "hound": ["afghan", "basset"] },
  "status": "success"
}`,
    tags: ["partial-mocks", "hybrid-proxy", "frontend", "incremental", "dog-ceo", "velocity", "prototyping"],
  },
  {
    id: "path-param-matching",
    category: "Routing & Path Matching",
    title: "How to Match Path Params In Mock APIs (Regex Capture Groups & Dynamic Path Variables)",
    description:
      "Match dynamic URL paths using regular expressions and named capture groups. Extract path parameter segments (e.g. /api/users/(?<userID>\\d+)) into template variables, and interpolate them directly into JSON mock response bodies using {{param 'userID'}} or {{pathParams.userID}}.",
    syntax: `// Rule Matching Criterion with Named Regex Capture Group:
Path Regex: /api/v1/users/(?<userID>\\d+)

// Dynamic Response Body Template:
{
  "id": "{{param 'userID'}}",
  "name": "{{faker 'person.fullName'}}",
  "email": "{{faker 'internet.email'}}"
}`,
    sampleRequest: `GET /api/v1/users/234
Header: Accept: application/json`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Execution-Tier: regex_path_param_match

{
  "id": "234",
  "name": "David Miller",
  "email": "david.m@example.com"
}`,
    tags: ["path-params", "regex", "named-groups", "routing", "variables", "template-engine", "matching"],
  },
  {
    id: "ssl-error-bypass",
    category: "Networking & TLS Security",
    title: "Bypass SSL Certificate Errors in Development (Ignore Upstream SSL & Self-Signed Certs)",
    description:
      "Unblock integration testing against 3rd-party vendor sandboxes (Salesforce Sandbox, Demandware, ServiceNow) with expired or misconfigured TLS certificates. Enable 'Ignore Upstream SSL Errors' in Mockbit Proxy Settings to bypass expired certs, hostname (CN) mismatches, self-signed CAs, and untrusted issuers without editing client code.",
    syntax: `// Proxy Setup Configuration in Studio Settings:
{
  "proxyTarget": "https://sandbox-api.salesforce.com",
  "ignoreSslErrors": true,
  "preserveHeaders": true
}

// Proxy Execution Header:
X-Mockbit-SSL-Validation: UPSTREAM_ERRORS_IGNORED`,
    sampleRequest: `GET https://my-proxy.mockbit.io/services/data/v58.0/sobjects/Account
Header: Authorization: Bearer token_sf_sandbox_99`,
    sampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
X-Mockbit-Upstream-TLS: BYPASSED_EXPIRED_CERTIFICATE

{
  "objectType": "Account",
  "totalSize": 1,
  "records": [{ "Id": "0018000000AAA", "Name": "Acme Corp Sandbox" }]
}`,
    tags: ["ssl", "tls", "ignore-ssl", "salesforce", "self-signed", "proxy", "expired-cert", "cn-mismatch"],
  },
  {
    id: "async-api-architecture",
    category: "Architecture & System Patterns",
    title: "Building & Mocking Asynchronous APIs (HTTP 202 Polling, Callback Webhooks & Background Callouts)",
    description:
      "Design and simulate asynchronous REST/SOAP APIs for long-running, resource-intensive operations. Master two core architecture patterns: Status Polling (HTTP 202 Accepted + status_url polling) and Callback Webhooks (asynchronous HTTP POST completion triggers). Simulate background job processing in Mockbit with instant 202 responses and concurrent outbound HTTP callouts.",
    syntax: `// Step 1: Client Request Submission:
POST /api/v1/process-image
Content-Type: application/json
{ "image_url": "https://cdn.example.com/raw.jpg", "callback_url": "https://client.com/webhook" }

// Step 2: Immediate Server Acknowledgment (HTTP 202 Accepted):
HTTP/1.1 202 Accepted
Content-Type: application/json
{ "job_id": "job_991823", "status_url": "/api/v1/process-image/status/job_991823" }`,
    sampleRequest: `POST /api/v1/process-image
Header: Content-Type: application/json
Body: { "image_url": "https://cdn.example.com/raw.jpg" }`,
    sampleResponse: `HTTP/1.1 202 Accepted
Content-Type: application/json
X-Mockbit-Execution-Tier: async_job_dispatcher

{
  "job_id": "job_991823",
  "status": "PROCESSING",
  "status_url": "/api/v1/process-image/status/job_991823",
  "estimatedDurationSeconds": 10
}`,
    tags: ["async", "202-accepted", "polling", "webhooks", "callout", "background-job", "architecture", "sequence"],
  },
  {
    id: "localization",
    category: "Localization & Regions",
    title: "11 Region Locales & Per-Request Locale Overrides",
    description:
      "Configure target locale per endpoint in Studio Settings or override per request via ?locale= parameter or X-Mockbit-Locale header. Supports 11 region locales (zh_CN, ja, fr, es, es_MX, pt_BR, id_ID, en_GB, en_IN, en_US, en).",
    syntax: `// Overrides via HTTP Header or Query Param:
GET /api/v1/users?locale=zh_CN
Header: X-Mockbit-Locale: ja

// Template:
{
  "firstName": "{{faker 'person.firstName'}}",
  "city": "{{faker 'location.city'}}",
  "company": "{{faker 'company.name'}}"
}`,
    sampleResponse: `// Response for ?locale=zh_CN:
{
  "firstName": "子骞",
  "city": "济头市",
  "company": "湖北省荣轩燃气无限公司"
}

// Response for ?locale=ja:
{
  "firstName": "愛美",
  "city": "橋本村",
  "company": "坂本食品有限会社"
}`,
    tags: ["localization", "locale", "zh_CN", "ja", "es", "fr"],
  },
  {
    id: "openapi",
    category: "API Specs & Contracts",
    title: "OpenAPI 3.0 Specification Import & Export Substrate",
    description:
      "Import existing OpenAPI 3.0.x JSON/YAML schemas to auto-generate mock endpoints, schemas, and routes. Export active Mockbit endpoints as compliant OpenAPI 3.0 specifications.",
    syntax: `POST /api/v1/openapi/import
Header: Content-Type: application/json
Body: { "openapi": "3.0.3", "info": { "title": "Petstore" }, "paths": { "/pets": { ... } } }

// Export URL:
GET /api/v1/openapi/export?endpointId=ep_123`,
    sampleResponse: `{
  "status": "success",
  "importedRoutes": 4,
  "openapiVersion": "3.0.3"
}`,
    tags: ["openapi", "swagger", "schema", "import", "export"],
  },
  {
    id: "sdk-generator",
    category: "Developer Tools",
    title: "Multi-Language SDK & Client Generator",
    description:
      "Generate ready-to-run client SDK code snippets in TypeScript, Python, cURL, Go, Java, and Rust for any endpoint created in Mockbit.",
    syntax: `// TypeScript SDK Snippet:
import { MockbitClient } from "@mockbit/sdk";
const client = new MockbitClient({ baseUrl: "https://mockbit.io/api/v1/public" });
const data = await client.get("/orders");`,
    sampleResponse: `// Python SDK Snippet:
import requests
response = requests.get("https://mockbit.io/api/v1/public/orders")
print(response.json())`,
    tags: ["sdk", "typescript", "python", "curl", "go", "java", "rust"],
  },
  {
    id: "proxy-recorder",
    category: "Traffic Recording",
    title: "Proxy Recorder & Real-Time Mock Generator",
    description:
      "Record live HTTP/HTTPS traffic to upstream target servers and automatically convert production requests and responses into reusable Mockbit mock rules.",
    syntax: `Proxy Target URL: https://api.stripe.com
Recorder Status: ACTIVE
Captured Traces: 14 API calls
Auto-Mock Rule Generator: 1-Click Convert`,
    sampleResponse: `{
  "status": "recording",
  "proxyTarget": "https://api.stripe.com",
  "capturedCount": 14
}`,
    tags: ["proxy", "recorder", "traffic", "capture", "auto-mock"],
  },
  {
    id: "arena-chaos",
    category: "Resilience & Chaos",
    title: "Mockbit Arena Chaos & Latency Fault Injection Runtime",
    description:
      "Simulate high latency jitter, random network disconnects, HTTP status code splits (e.g. 95% 200 / 5% 500), and rate-limit faults (429 Too Many Requests) to validate client retry resilience.",
    syntax: `X-Mockbit-Execution-Tier: chaos_fault
Latency Jitter: 450ms +/- 100ms
Fault Type: Random 503 Service Unavailable`,
    sampleResponse: `{
  "error": "Service Unavailable",
  "code": "CHAOS_FAULT_INJECTED",
  "latencyMs": 482
}`,
    tags: ["chaos", "faults", "latency", "jitter", "resilience"],
  },
  {
    id: "webhooks",
    category: "Event Cascades",
    title: "Asynchronous Webhooks & Event Cascade Substrate",
    description:
      "Trigger asynchronous background webhooks or callout URLs upon HTTP request execution with configurable retry backoffs and signature headers.",
    syntax: `Trigger: POST /orders
Callout URL: https://webhook.site/order-listener
Execution Mode: Asynchronous Fire-and-Forget
Payload Template: { "event": "order_created", "id": "{{body 'id'}}" }`,
    sampleResponse: `{
  "webhookTriggered": true,
  "calloutStatus": 202
}`,
    tags: ["webhooks", "async", "events", "callbacks", "cascades"],
  },
];

export default function ProductionDocsPage() {
  const [activeId, setActiveId] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSections = DOC_SECTIONS.filter((sec) => {
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.description.toLowerCase().includes(q) ||
      sec.tags.some((t) => t.toLowerCase().includes(q)) ||
      sec.category.toLowerCase().includes(q)
    );
  });

  const activeSection = DOC_SECTIONS.find((s) => s.id === activeId) || DOC_SECTIONS[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-mb-bg text-mb-text flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-mb-border bg-mb-bg/90 backdrop-saturate-150 px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 group">
          <MarkIcon />
          <span className="font-semibold text-base tracking-tight text-mb-text">mockbit</span>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-mb-bg-raised text-mb-text-tertiary border border-mb-border">
            Production Documentation & Engine Hub
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/docs" className="text-mb-text font-semibold underline underline-offset-4 decoration-mb-accent">
            Docs & Template Engine
          </Link>
          <Link href="/resources" className="text-mb-text-tertiary hover:text-mb-text transition-colors">
            Public Datasets & Substrate
          </Link>
          <Link href="/dashboard" className="mb-btn-secondary inline-flex h-8 items-center px-3">
            Dashboard
          </Link>
          <Link href="/dashboard/endpoints/new" className="mb-btn-primary inline-flex h-8 items-center px-3">
            Create Custom API
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Left Sidebar */}
        <div className="w-full md:w-72 shrink-0 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-mb-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features, syntax, tags..."
              className="w-full bg-mb-surface border border-mb-border rounded-lg pl-8 pr-3 py-2 text-xs text-mb-text placeholder:text-mb-text-disabled focus:outline-none focus:border-mb-accent font-mono"
            />
          </div>

          {/* Navigation Category List */}
          <div className="bg-mb-surface border border-mb-border rounded-xl p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="text-3xs font-mono uppercase tracking-wider text-mb-text-tertiary px-2.5 py-1">
              Documentation Index ({filteredSections.length})
            </div>
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveId(sec.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  activeId === sec.id
                    ? "bg-mb-bg-raised text-mb-text border border-mb-border font-semibold shadow-sm"
                    : "text-mb-text-secondary hover:text-mb-text hover:bg-mb-bg-raised/50 border border-transparent"
                }`}
              >
                <span className="truncate">{sec.title}</span>
                {activeId === sec.id && <Sparkles className="w-3 h-3 text-mb-accent shrink-0 ml-1.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Active Section Header Card */}
          <div className="bg-mb-surface border border-mb-border rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-mb-accent/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-3xs font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-mb-bg-raised border border-mb-border text-mb-accent font-bold">
                {activeSection.category}
              </span>
              {activeSection.tags.map((t) => (
                <span key={t} className="text-3xs font-mono px-1.5 py-0.5 rounded bg-mb-bg border border-mb-border text-mb-text-tertiary">
                  #{t}
                </span>
              ))}
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-mb-text mb-2">
              {activeSection.title}
            </h1>
            <p className="text-xs md:text-sm text-mb-text-secondary leading-relaxed">
              {activeSection.description}
            </p>
          </div>

          {/* Syntax Code Card */}
          <div className="bg-mb-surface border border-mb-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-mb-text font-mono">
                <Code2 className="w-4 h-4 text-mb-accent" />
                Template Syntax & Usage
              </div>
              <button
                onClick={() => handleCopy(activeSection.syntax, "syntax")}
                className="mb-btn-secondary h-7 px-2.5 text-3xs font-mono inline-flex items-center gap-1.5"
              >
                {copiedId === "syntax" ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-mb-text-tertiary" />
                    <span>Copy Syntax</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-mb-bg border border-mb-border rounded-xl p-4 text-xs font-mono text-mb-text-secondary overflow-x-auto leading-relaxed">
              <code>{activeSection.syntax}</code>
            </pre>
          </div>

          {/* Sample Request & Expected Response Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeSection.sampleRequest && (
              <div className="bg-mb-surface border border-mb-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-mb-text font-mono">
                    <Terminal className="w-4 h-4 text-mb-accent" />
                    Sample Request Trigger
                  </div>
                  <button
                    onClick={() => handleCopy(activeSection.sampleRequest || "", "req")}
                    className="mb-btn-secondary h-7 px-2.5 text-3xs font-mono inline-flex items-center gap-1.5"
                  >
                    {copiedId === "req" ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-mb-text-tertiary" />
                        <span>Copy Request</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-mb-bg border border-mb-border rounded-xl p-4 text-xs font-mono text-mb-text-secondary overflow-x-auto leading-relaxed">
                  <code>{activeSection.sampleRequest}</code>
                </pre>
              </div>
            )}

            <div className={`bg-mb-surface border border-mb-border rounded-2xl p-5 space-y-3 ${!activeSection.sampleRequest ? "lg:col-span-2" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-mb-text font-mono">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  Expected Generated Response
                </div>
                <button
                  onClick={() => handleCopy(activeSection.sampleResponse, "res")}
                  className="mb-btn-secondary h-7 px-2.5 text-3xs font-mono inline-flex items-center gap-1.5"
                >
                  {copiedId === "res" ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-mb-text-tertiary" />
                      <span>Copy Response</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-mb-bg border border-mb-border rounded-xl p-4 text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">
                <code>{activeSection.sampleResponse}</code>
              </pre>
            </div>
          </div>

          {/* Feature Highlight Footer */}
          <div className="bg-mb-surface/60 border border-mb-border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-mb-text flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4 text-mb-accent" />
                Ready to build dynamic stateful APIs?
              </div>
              <p className="text-2xs text-mb-text-tertiary">
                Test these templates instantly inside the Mockbit Studio or deploy your own endpoints.
              </p>
            </div>
            <Link href="/dashboard/endpoints/new" className="mb-btn-primary h-8 px-4 text-xs inline-flex items-center gap-1.5 shrink-0">
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
