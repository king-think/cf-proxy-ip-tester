// functions/api/extract-ips.js

export async function onRequest(context) {
  const { env } = context;
  try {
    // 1. 分页列出所有 KV key
    let cursor = undefined;
    const allKeys = [];
    do {
      const listRes = await env.KV.list({ limit: 1000, cursor });
      allKeys.push(...listRes.keys.map(k => k.name));
      cursor = listRes.cursor;
    } while (!cursor === undefined && cursor);

    const ipPortRe = /(\d{1,3}(?:\.\d{1,3}){3}:\d{1,5})/;
    const byKey = {};
    const allSet = new Set();

    // 2. 逐键读取并提取
    await Promise.all(allKeys.map(async key => {
      const raw = await env.KV.get(key) || "";
      const lines = raw.split(/\r?\n/);
      const ips = [];

      for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const m = t.match(ipPortRe);
        if (m) {
          const ip = m[1];
          ips.push(ip);
          allSet.add(ip);
        }
      }

      if (ips.length) {
        byKey[key] = ips;
      }
    }));

    // 3. 构造返回
    const result = {
      byKey,
      all: Array.from(allSet)
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("extract-ips error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
