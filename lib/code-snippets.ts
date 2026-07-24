/**
 * Multi-Language Client Code Snippet Generators for Mockbit
 * FAANG-grade developer utility module.
 */

export interface SnippetParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export function generateCurlSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  let cmd = `curl -X ${method.toUpperCase()} "${url}"`;
  
  Object.entries(headers).forEach(([k, v]) => {
    cmd += ` \\\n  -H "${k}: ${v}"`;
  });

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    const jsonStr = typeof body === "string" ? body : JSON.stringify(body);
    cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${jsonStr}'`;
  }

  return cmd;
}

export function generateFetchSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  const options: any = {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  }

  return `const response = await fetch("${url}", ${JSON.stringify(options, null, 2)});
const data = await response.json();
console.log(data);`;
}

export function generateAxiosSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  const bodyStr = body ? `, ${JSON.stringify(body, null, 2)}` : "";
  const headerStr = Object.keys(headers).length > 0 ? `, { headers: ${JSON.stringify(headers, null, 2)} }` : "";

  if (method.toUpperCase() === "GET") {
    return `import axios from "axios";

const { data } = await axios.get("${url}"${headerStr});
console.log(data);`;
  }

  return `import axios from "axios";

const { data } = await axios.${method.toLowerCase()}("${url}"${bodyStr}${headerStr});
console.log(data);`;
}

export function generatePythonRequestsSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  let py = `import requests\n\nurl = "${url}"\n`;

  if (Object.keys(headers).length > 0) {
    py += `headers = ${JSON.stringify(headers, null, 4).replace(/true/g, "True").replace(/false/g, "False")}\n`;
  } else {
    py += `headers = {"Content-Type": "application/json"}\n`;
  }

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    py += `payload = ${JSON.stringify(body, null, 4).replace(/true/g, "True").replace(/false/g, "False")}\n\n`;
    py += `response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\n`;
  } else {
    py += `\nresponse = requests.${method.toLowerCase()}(url, headers=headers)\n`;
  }

  py += `print(response.json())`;
  return py;
}

export function generateGoSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  let go = `package main

import (
    "fmt"
    "io"
    "net/http"
`;

  if (body) {
    go += `    "bytes"\n    "encoding/json"\n`;
  }

  go += `)

func main() {
    url := "${url}"
`;

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    go += `    payload, _ := json.Marshal(${JSON.stringify(body)})\n`;
    go += `    req, _ := http.NewRequest("${method.toUpperCase()}", url, bytes.NewBuffer(payload))\n`;
  } else {
    go += `    req, _ := http.NewRequest("${method.toUpperCase()}", url, nil)\n`;
  }

  go += `    req.Header.Set("Content-Type", "application/json")\n`;
  Object.entries(headers).forEach(([k, v]) => {
    go += `    req.Header.Set("${k}", "${v}")\n`;
  });

  go += `
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;

  return go;
}

export function generatePhpSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  let php = `<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "${url}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => "${method.toUpperCase()}",
`;

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    php += `    CURLOPT_POSTFIELDS => '${JSON.stringify(body)}',\n`;
  }

  php += `    CURLOPT_HTTPHEADER => [\n`;
  php += `        'Content-Type: application/json',\n`;
  Object.entries(headers).forEach(([k, v]) => {
    php += `        '${k}: ${v}',\n`;
  });
  php += `    ],\
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;

  return php;
}

export function generateJavaSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  let java = `import okhttp3.*;

public class MockbitClient {
    public static void main(String[] args) throws Exception {
        OkHttpClient client = new OkHttpClient();
`;

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    java += `        MediaType mediaType = MediaType.parse("application/json");\n`;
    java += `        RequestBody body = RequestBody.create(mediaType, "${JSON.stringify(body).replace(/"/g, '\\"')}");\n`;
    java += `        Request request = new Request.Builder()\n`;
    java += `            .url("${url}")\n`;
    java += `            .method("${method.toUpperCase()}", body)\n`;
  } else {
    java += `        Request request = new Request.Builder()\n`;
    java += `            .url("${url}")\n`;
    java += `            .get()\n`;
  }

  java += `            .addHeader("Content-Type", "application/json")\n`;
  Object.entries(headers).forEach(([k, v]) => {
    java += `            .addHeader("${k}", "${v}")\n`;
  });

  java += `            .build();

        Response response = client.newCall(request).execute();
        System.out.println(response.body().string());
    }
}`;

  return java;
}

export function generateSwiftSnippet({ url, method = "GET", headers = {}, body }: SnippetParams): string {
  let swift = `import Foundation

guard let url = URL(string: "${url}") else { fatalError("Invalid URL") }
var request = URLRequest(url: url)
request.httpMethod = "${method.toUpperCase()}"
request.addValue("application/json", forHTTPHeaderField: "Content-Type")
`;

  Object.entries(headers).forEach(([k, v]) => {
    swift += `request.addValue("${v}", forHTTPHeaderField: "${k}")\n`;
  });

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    swift += `let jsonBody = ${JSON.stringify(body)}\n`;
    swift += `request.httpBody = try? JSONSerialization.data(withJSONObject: jsonBody)\n`;
  }

  swift += `
let task = URLSession.shared.dataTask(with: request) { data, response, error in
    guard let data = data, error == nil else { return }
    if let jsonString = String(data: data, encoding: .utf8) {
        print(jsonString)
    }
}
task.resume()`;

  return swift;
}
