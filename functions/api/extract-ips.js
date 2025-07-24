// functions/api/extract-ips.js

/**
 * Cloudflare Pages Function: 提取 KV 中的 IP:端口 列表
 *
 * 绑定 env.ADD 为你的 KV namespace。
 * 本函数读取 key="ADD" 的值，过滤注释/空行，提取所有 "x.x.x.x:port"，返回 JSON。
 */

export async function onRequest(context) {
  const { env } = context;
  try {
    // 1. 从 KV 读原始文本
    const raw = await env.ADD.get("ADD") || "";

    // 2. 按行拆分，过滤注释和空行，提取 IP:端口
    const lines = raw.split(/\r?\n/);
    const ipPortRe = /(\d{1,3}(?:\.\d{1,3}){3}:\d{1,5})/;
    const ips = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const m = t.match(ipPortRe);
      if (m) ips.push(m[1]);
    }

    // 3. 返回 JSON
    return new Response(JSON.stringify({ ips }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error extracting IPs:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
