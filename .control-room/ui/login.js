/* The login page's whole script. It asks which provider is
   configured and shows the matching form. It decides nothing: the
   endpoint each form posts to refuses outright when its provider is
   not the configured one, so hiding a form is a courtesy and not a
   control. */
const $ = (id) => document.getElementById(id);
const next = new URLSearchParams(location.search).get('next') || '/';

const fail = (message) => { const e = $('error'); e.textContent = message; e.hidden = false; };

try {
  const res = await fetch('/auth/providers', { headers: { accept: 'application/json' } });
  const { provider } = await res.json();
  if (provider === 'oidc') { $('oidc').hidden = false; $('oidc-next').value = next; }
  else { $('local').hidden = false; }
} catch {
  $('local').hidden = false;
  fail('The server did not say which authentication provider is configured. The form below may not be the right one.');
}

$('local').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('error').hidden = true;
  const res = await fetch('/auth/local', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ subject: $('subject').value, password: $('password').value, next }),
  });
  if (res.ok) { location.href = next; return; }
  const body = await res.json().catch(() => ({}));
  fail(body.reason || 'Sign-in failed.');
});
