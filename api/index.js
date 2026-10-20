export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Bot is running!');

  const { t, d } = req.body;
  if (t !== 'GROUP_AT_MESSAGE_CREATE' && t !== 'AT_MESSAGE_CREATE') return res.status(200).send('Ignored');

  const content = d.content.trim();
  const msgId = d.id;

  // 1. 请求 DeepSeek 生成回答
  const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: content }]
    })
  });
  const aiData = await aiRes.json();
  const replyText = aiData.choices?.[0]?.message?.content || 'AI 脑子短路了~';

  // 2. 获取 QQ Access Token
  const tokenRes = await fetch('https://bots.qq.com/app/getAppAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appId: process.env.QQ_APPID,
      clientSecret: process.env.QQ_SECRET
    })
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 3. 发送消息回 QQ 群
  const sendRes = await fetch(`https://api.sgroup.qq.com/v2/groups/${d.group_openid}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `QQBot ${accessToken}`
    },
    body: JSON.stringify({
      content: replyText,
      msg_type: 0,
      msg_id: msgId
    })
  });

  return res.status(200).send('Success');
}
