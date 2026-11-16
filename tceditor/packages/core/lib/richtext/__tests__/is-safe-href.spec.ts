import { isSafeHref } from "../is-safe-href";

describe("isSafeHref", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1&page=2#top",
    "HTTPS://EXAMPLE.COM",
    "mailto:someone@example.com",
    "tel:+886-2-1234-5678",
    "/relative/path",
    "relative/path",
    "./page",
    "../page",
    "#section",
    "?query=1",
    "//cdn.example.com/file",
    "/path/with:colon",
  ])("allows %j", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "\tjavascript:alert(1)",
    "\u0001javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java script:alert(1)",
    "​javascript:alert(1)",
    "&#106;avascript:alert(1)",
    "&#x6A;avascript:alert(1)",
    "&#106avascript:alert(1)",
    "javascript&colon;alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com",
    "",
    "   ",
  ])("rejects %j", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });

  it.each([undefined, null, 1, {}, [], true])(
    "rejects non-strings (%p)",
    (href) => {
      expect(isSafeHref(href)).toBe(false);
    }
  );
});
