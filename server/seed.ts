import type { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';
import type { LessonBlock } from '../shared/schemas.js';

type Q = { prompt: string; options: string[]; correct: number; explanation: string };

const UNIT1_LESSONS: { title: string; minutes: number; blocks: LessonBlock[] }[] = [
  {
    title: 'Phishing and social engineering',
    minutes: 6,
    blocks: [
      { type: 'p', text: 'Phishing is when an attacker pretends to be someone you trust — your university, a bank, M-Pesa, or a friend — to trick you into giving away passwords, money or personal information.' },
      { type: 'h', text: 'Common warning signs' },
      { type: 'list', items: [
        'Urgency or threats: "Your account will be closed in 24 hours".',
        'A sender address or link that is slightly wrong, e.g. riara-university.co instead of the official domain.',
        'Requests for your password, PIN or one-time code. Legitimate services never ask for these.',
        'Unexpected attachments or prizes you never entered for.'
      ] },
      { type: 'h', text: 'Social engineering beyond email' },
      { type: 'p', text: 'Attackers also use SMS ("smishing"), phone calls ("vishing") and WhatsApp messages. A classic local example is a caller claiming you sent money to the wrong number and asking you to "reverse" it.' },
      { type: 'tip', text: 'Pause, verify through a channel you already trust (the official app, website or office), and never share one-time codes.' }
    ]
  },
  {
    title: 'Passwords and account security',
    minutes: 5,
    blocks: [
      { type: 'p', text: 'Most account takeovers happen because a password was guessed, reused, or stolen in another website’s data breach.' },
      { type: 'h', text: 'Build strong passwords' },
      { type: 'list', items: [
        'Use a long passphrase: four or more random words is stronger than a short complex word.',
        'Never reuse the same password on two sites.',
        'Use a password manager to remember them for you.'
      ] },
      { type: 'h', text: 'Turn on two-factor authentication (2FA)' },
      { type: 'p', text: '2FA asks for a second proof, such as a code from an authenticator app. Even if your password leaks, the attacker still cannot sign in.' },
      { type: 'warn', text: 'If anyone asks you to read out a 2FA code, it is a scam. That code is the key to your account.' }
    ]
  },
  {
    title: 'Safe browsing and suspicious links',
    minutes: 5,
    blocks: [
      { type: 'p', text: 'Before you click, read the link. The real destination is the domain just before the first single slash.' },
      { type: 'list', items: [
        'portal.riarauniversity.ac.ke/login — the domain is riarauniversity.ac.ke.',
        'riarauniversity.ac.ke.verify-login.com — the real domain is verify-login.com. Danger.',
        'Shortened links (bit.ly and similar) hide the destination; preview them first.'
      ] },
      { type: 'tip', text: 'The padlock (HTTPS) only means the connection is encrypted. Scam sites can have a padlock too.' },
      { type: 'p', text: 'Keep your browser and phone updated, and avoid entering passwords on public Wi-Fi without a trusted connection.' }
    ]
  }
];

const UNIT2_LESSONS: typeof UNIT1_LESSONS = [
  {
    title: 'HTTPS and TLS',
    minutes: 6,
    blocks: [
      { type: 'p', text: 'HTTPS wraps web traffic in TLS encryption so people on the same network cannot read or modify what you send.' },
      { type: 'list', items: [
        'Confidentiality: data is encrypted in transit.',
        'Integrity: tampering is detected.',
        'Authentication: the certificate proves the server owns the domain.'
      ] },
      { type: 'warn', text: 'HTTPS does not prove a website is honest — only that you are talking securely to whoever owns that domain.' }
    ]
  },
  {
    title: 'Injection attacks and input validation',
    minutes: 7,
    blocks: [
      { type: 'p', text: 'SQL injection happens when user input is pasted directly into a database query, letting an attacker change the query itself.' },
      { type: 'h', text: 'Defences' },
      { type: 'list', items: [
        'Use parameterised queries — the database treats input as data, never as code.',
        'Validate input on the server: type, length and allowed values.',
        'Give the database account only the permissions it needs.'
      ] },
      { type: 'tip', text: 'Client-side validation improves usability, but only server-side validation provides security. Anyone can bypass the browser.' }
    ]
  },
  {
    title: 'Sessions and cookies',
    minutes: 5,
    blocks: [
      { type: 'p', text: 'After you log in, the server gives your browser a session cookie. Whoever holds that cookie is treated as you.' },
      { type: 'list', items: [
        'HttpOnly: JavaScript cannot read the cookie, limiting theft through XSS.',
        'Secure: only sent over HTTPS.',
        'SameSite: not sent with requests from other sites, which helps block CSRF.',
        'Expiry: sessions should end, and logging out should invalidate them on the server.'
      ] }
    ]
  }
];

const PRACTICE_PHISHING: Q[] = [
  { prompt: 'You get an SMS: "Your Riara portal will be suspended today. Log in here: riara-portal-verify.com". What should you do?', options: ['Click the link quickly before the deadline', 'Ignore the link and check the portal through the official website you already know', 'Reply asking if it is real', 'Forward it to classmates so they are warned by clicking'], correct: 1, explanation: 'Urgency plus an unofficial domain are classic phishing signs. Verify through a channel you already trust.' },
  { prompt: 'A caller says they sent you money by mistake and asks you to reverse it, then asks for the code you just received. The code is…', options: ['Safe to share — it only confirms the reversal', 'The key that lets them take over your account or transaction', 'Needed by Safaricom staff', 'Useless to anyone else'], correct: 1, explanation: 'One-time codes authorise actions on your account. Nobody legitimate will ask you to read one out.' },
  { prompt: 'Which link really belongs to the university domain riarauniversity.ac.ke?', options: ['riarauniversity.ac.ke.login-help.com/portal', 'portal.riarauniversity.ac.ke/login', 'riarauniversity-ac-ke.net', 'bit.ly/riara-portal'], correct: 1, explanation: 'The real domain is the part just before the first single slash. Only option B ends in riarauniversity.ac.ke.' },
  { prompt: 'Which password is strongest?', options: ['Amina2004!', 'P@ssw0rd', 'mango-river-lamp-kettle-42', 'riara123'], correct: 2, explanation: 'Length matters most. A long passphrase of random words is far harder to guess than a short "complex" word.' },
  { prompt: 'A website shows a padlock icon. This means…', options: ['The site is trustworthy', 'The connection is encrypted, but the site could still be a scam', 'The site is run by the government', 'Your password will be stored safely'], correct: 1, explanation: 'HTTPS protects the connection, not the honesty of the site owner.' }
];

const FORMAL_CAT: Q[] = [
  { prompt: 'What is the main purpose of two-factor authentication?', options: ['To make passwords shorter', 'To require a second proof so a stolen password alone is not enough', 'To encrypt your files', 'To block all phishing emails'], correct: 1, explanation: '2FA adds a second factor, so a leaked password alone cannot unlock the account.' },
  { prompt: 'Reusing one password across many sites is risky because…', options: ['Sites will reject it', 'A breach on one site exposes all your other accounts', 'It makes typing slower', 'It is illegal'], correct: 1, explanation: 'Attackers try leaked credentials on other services ("credential stuffing").' },
  { prompt: '"Smishing" refers to phishing through…', options: ['Email', 'Phone calls', 'SMS text messages', 'Fake Wi-Fi networks'], correct: 2, explanation: 'Smishing = SMS phishing. Vishing is voice (phone call) phishing.' },
  { prompt: 'Which is the safest response to an unexpected email attachment from an unknown sender?', options: ['Open it on your phone instead of your laptop', 'Open it, then delete it', 'Do not open it; verify with the sender through another channel', 'Forward it to IT and also open it'], correct: 2, explanation: 'Unexpected attachments are a common malware route. Verify first, through a separate channel.' },
  { prompt: 'Which statement about social engineering is true?', options: ['It only happens through email', 'It manipulates people rather than breaking technology', 'Antivirus software stops all of it', 'It only targets companies'], correct: 1, explanation: 'Social engineering exploits trust, urgency and fear — human factors, not technical flaws.' },
  { prompt: 'Where should you check whether a password-reset request is real?', options: ['The link in the message', 'By replying to the message', 'The official app or a website address you type yourself', 'A link a friend sends you'], correct: 2, explanation: 'Use a path you control. Links inside the suspicious message are exactly what the attacker controls.' }
];

const PRACTICE_WEB: Q[] = [
  { prompt: 'Which defence stops SQL injection most reliably?', options: ['Hiding error messages', 'Parameterised queries', 'Client-side validation only', 'Using HTTPS'], correct: 1, explanation: 'Parameterised queries keep user input as data, so it can never change the query structure.' },
  { prompt: 'The HttpOnly cookie flag…', options: ['Forces HTTPS', 'Stops JavaScript from reading the cookie', 'Deletes the cookie on logout', 'Encrypts the cookie'], correct: 1, explanation: 'HttpOnly hides the cookie from scripts, reducing session theft through XSS.' },
  { prompt: 'Why is client-side validation alone not enough for security?', options: ['Browsers are slow', 'Attackers can bypass the browser and send requests directly', 'It does not work on phones', 'It is not allowed in Kenya'], correct: 1, explanation: 'Anyone can craft requests with tools like curl. The server must validate everything.' },
  { prompt: 'TLS provides confidentiality, integrity and…', options: ['Authentication of the server', 'Virus scanning', 'Faster loading', 'Password storage'], correct: 0, explanation: 'Certificates authenticate that the server controls the domain.' }
];

let n = 0;
const id = (p: string) => `${p}_${(++n).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function seed(db: PGlite) {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const users = [
    { id: 'usr_lecturer', name: 'Dr. Grace Mwangi', email: 'lecturer@salama.ac.ke', pw: 'lecturer123', role: 'lecturer' },
    { id: 'usr_amina', name: 'Amina Wanjiku', email: 'amina@salama.ac.ke', pw: 'amina123', role: 'student' },
    { id: 'usr_brian', name: 'Brian Otieno', email: 'brian@salama.ac.ke', pw: 'brian123', role: 'student' }
  ];
  for (const u of users) {
    await db.query('INSERT INTO users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)', [u.id, u.name, u.email, hash(u.pw), u.role]);
  }
  await db.query(`INSERT INTO classes (id,name,join_code,lecturer_id) VALUES ('cls_websec','BIT 2203 · Web & Cyber Security','WEBSEC24','usr_lecturer')`);
  await db.query(`INSERT INTO class_members (class_id,user_id) VALUES ('cls_websec','usr_amina')`);

  const units = [
    { id: 'unit_hygiene', title: 'Unit 1 · Cyber Hygiene Essentials', description: 'Recognise phishing, protect your accounts and browse safely.', lessons: UNIT1_LESSONS },
    { id: 'unit_web', title: 'Unit 2 · Web Security Basics', description: 'How HTTPS, input validation and sessions protect web applications.', lessons: UNIT2_LESSONS }
  ];
  for (const [ui, u] of units.entries()) {
    await db.query('INSERT INTO units (id,class_id,title,description,position) VALUES ($1,$2,$3,$4,$5)', [u.id, 'cls_websec', u.title, u.description, ui]);
    for (const [li, l] of u.lessons.entries()) {
      await db.query('INSERT INTO lessons (id,unit_id,title,position,minutes,blocks) VALUES ($1,$2,$3,$4,$5,$6::jsonb)', [id('les'), u.id, l.title, li, l.minutes, JSON.stringify(l.blocks)]);
    }
  }

  const week = new Date(Date.now() + 7 * 864e5).toISOString();
  await insertAssessment(db, { id: 'asm_phish_practice', unitId: 'unit_hygiene', title: 'Spot the Phish — practice quiz', mode: 'practice', timeLimitMin: null, deadline: null, maxAttempts: 10 }, PRACTICE_PHISHING);
  await insertAssessment(db, { id: 'asm_cat1', unitId: 'unit_hygiene', title: 'CAT 1 · Cyber Hygiene', mode: 'formal', timeLimitMin: 15, deadline: week, maxAttempts: 3 }, FORMAL_CAT);
  await insertAssessment(db, { id: 'asm_web_practice', unitId: 'unit_web', title: 'Web Security — practice quiz', mode: 'practice', timeLimitMin: null, deadline: null, maxAttempts: 10 }, PRACTICE_WEB);
}

export async function insertAssessment(
  db: PGlite,
  a: { id: string; unitId: string; title: string; mode: 'practice' | 'formal'; timeLimitMin: number | null; deadline: string | null; maxAttempts: number },
  qs: Q[]
) {
  await db.query('INSERT INTO assessments (id,unit_id,title,mode,time_limit_min,deadline,max_attempts) VALUES ($1,$2,$3,$4,$5,$6,$7)', [a.id, a.unitId, a.title, a.mode, a.timeLimitMin, a.deadline, a.maxAttempts]);
  for (const [qi, q] of qs.entries()) {
    const options = q.options.map((text) => ({ id: id('opt'), text }));
    await db.query('INSERT INTO questions (id,assessment_id,position,prompt,options,correct_option_id,explanation) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)', [id('q'), a.id, qi, q.prompt, JSON.stringify(options), options[q.correct].id, q.explanation]);
  }
  await db.query('UPDATE units SET version = version + 1 WHERE id = $1', [a.unitId]);
}
