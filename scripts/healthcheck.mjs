const baseUrl = process.env.HEALTHCHECK_URL || `http://localhost:${process.env.PORT || 3000}`;

async function check() {
  const endpoints = [
    { path: "/healthz", want: (r) => r.status === 200 && r.json?.status === "ok" },
    { path: "/readyz", want: (r) => r.status === 200 && r.json?.status === "ok" },
  ];

  let ok = true;
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.path}`);
      const json = await res.json().catch(() => null);
      const passed = ep.want({ status: res.status, json });
      console.log(`${ep.path}: ${res.status} ${JSON.stringify(json)} ${passed ? "OK" : "FAIL"}`);
      if (!passed) ok = false;
    } catch (err) {
      console.error(`${ep.path}: ERROR ${err.message}`);
      ok = false;
    }
  }
  process.exit(ok ? 0 : 1);
}

check();
