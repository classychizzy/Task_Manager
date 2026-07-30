// tests/__tests__/helpers/securitypayload.ts
export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "' OR 1=1 --",
  "admin'--",
  "' UNION SELECT * FROM users --",
];

export const xssPayloads = [
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert(1)>",
  "javascript:alert(1)",
];