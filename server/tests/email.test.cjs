const { test } = require('node:test');
const assert = require('node:assert/strict');
// Never initialize a real SMTP connection in these template tests.
process.env.SMTP_HOST = '';
const { emailService } = require('../dist/services/email.js');
let last;
emailService.sendEmail = async options => { last = options; return true; };
test('server dictionaries have the same keys and interpolation variables', () => {
  const en = require('../src/locales/en.json');
  const es = require('../src/locales/es.json');
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort());
  const variables = text => [...text.matchAll(/\{\{([^}]+)\}\}/g)].map(match => match[1]).sort();
  for (const key of Object.keys(en)) assert.deepEqual(variables(en[key]), variables(es[key]), key);
});

test('all server email types use Spanish subjects and bodies by default', async () => {
  delete process.env.EMAIL_LOCALE;
  const person = { email: 'test@example.com', name: '<Ana>', productName: 'Roost' };
  await emailService.sendWelcomeEmail({ ...person, resetPasswordUrl: 'https://example.com/reset' });
  assert.match(last.subject, /bienvenida/i);
  assert.match(last.html, /Hola/);
  assert.match(last.html, /&lt;Ana&gt;/);
  assert.match(last.text, /contraseña/);
  await emailService.sendSubscriptionCancelledEmail({ ...person, gracePeriodEnds: new Date(2026, 10, 20) });
  assert.match(last.subject, /cancelada/);
  assert.match(last.html, /noviembre/);
  assert.match(last.text, /cancelada/);
  await emailService.sendSubscriptionReactivatedEmail(person);
  assert.match(last.subject, /activa/);
  assert.match(last.text, /reactivado/);
  await emailService.sendPasswordResetEmail({ ...person, resetUrl: 'https://example.com/reset' });
  assert.match(last.subject, /contraseña/);
  assert.match(last.text, /contraseña/);
  await emailService.sendNotificationEmail({ to: person.email, userName: person.name, notificationType: 'new_comment', title: 'User content', link: 'https://evil.example.com' });
  assert.match(last.subject, /Nuevo comentario/);
  assert.match(last.text, /notificaciones/);
  assert.doesNotMatch(last.html, /href="https:\/\/evil/);
  for (const status of ['pending', 'in_progress', 'completed', 'rejected']) {
    await emailService.sendActivationStatusEmail({ ...person, status, websiteUrl: 'https://example.com' });
    assert.match(last.subject, /activación/i);
    assert.match(last.text, /Estado:/);
    assert.doesNotMatch(last.html, /IN_PROGRESS|PENDING|COMPLETED|REJECTED/);
  }
});
test('English email subjects and text remain available', async () => {
  process.env.EMAIL_LOCALE = 'en';
  await emailService.sendWelcomeEmail({ email: 'test@example.com', name: 'Ana', productName: 'Roost', resetPasswordUrl: 'https://example.com/reset' });
  assert.equal(last.subject, 'Welcome to Roost - Roost');
  assert.match(last.text, /Set|set your password/);
  await emailService.sendNotificationEmail({ to: 'test@example.com', userName: 'Ana', notificationType: 'new_comment', title: 'A post' });
  assert.equal(last.subject, 'New Comment: A post');
});
