// /api/_telegram.js
import crypto from 'crypto';

export function verifyInitData(initData, botToken) {
  if (!initData) throw new Error('No initData');
  const urlData = new URLSearchParams(initData);

  const hash = urlData.get('hash');
  urlData.delete('hash');

  // build data_check_string (sorted by key)
  const pairs = [];
  for (const [k, v] of urlData.entries()) pairs.push(`${k}=${v}`);
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (calc !== hash) throw new Error('Bad initData signature');

  // parse user json
  const userJson = urlData.get('user');
  if (!userJson) throw new Error('No user in initData');
  const user = JSON.parse(userJson);
  return { telegram_id: String(user.id), username: user.username || user.first_name || 'user' };
}
