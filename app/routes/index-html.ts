const INDEX_HTML_REDIRECT = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to Webdeck</title>
    <meta http-equiv="refresh" content="0; url=/" />
    <script>
      window.location.replace("/");
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="/">Webdeck</a>...</p>
  </body>
</html>`;

export function loader() {
  return new Response(INDEX_HTML_REDIRECT, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
