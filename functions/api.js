export async function onRequestGet(context) {
    const raw = await context.env.KV.get('mwi_shared');
    return new Response(raw ?? '{"d":null}', {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',   // 游戏页 + 计算器页都要跨域访问
        },
    });
}

export async function onRequestPut(context) {
    const body = await context.request.text();
    // 建议校验一个简单的令牌（header 或 URL 参数），防止任何人覆盖数据
    await context.env.KV.put('mwi_shared', body);
    return new Response('{"ok":true}', { headers: { 'Access-Control-Allow-Origin': '*' } });
}