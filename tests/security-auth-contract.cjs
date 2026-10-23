const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
// Next's bundler resolves its extensionless subpaths; Node's bare ESM loader
// needs the equivalent file resolution for this standalone offline contract.
Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^next\/(server|headers|navigation)$/.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    return nextResolve(specifier, context);
  },
});

(async () => {
  // Synthetic configuration only; never load dotenv or connect to a backend.
  process.env.AUTH_SECRET = 'offline-contract-secret-with-at-least-32-characters';
  process.env.AUTH_TRUST_HOST = 'true';
  process.env.NEXT_PUBLIC_API_URL = 'https://backend.invalid';
  for (const provider of ['GOOGLE', 'LINKEDIN', 'GITHUB']) {
    process.env[`AUTH_${provider}_ID`] = 'synthetic-id';
    process.env[`AUTH_${provider}_SECRET`] = 'synthetic-secret';
  }
  globalThis.fetch = async () => { throw new Error('Unexpected external request'); };
  const { default: NextAuth } = await import('next-auth');
  let config;
  const filename = path.resolve(__dirname, '../lib/auth.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const realRequire = loaded.require.bind(loaded);
  loaded.require = name => name === 'next-auth'
    ? { __esModule: true, default: value => { config = value; return NextAuth(value); } }
    : realRequire(name);
  loaded._compile(compiled, filename);

  // Real Auth.js handler and provider implementations, without an OAuth exchange.
  const response = await loaded.exports.handlers.GET(new Request('http://localhost:3000/api/auth/providers'));
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(await response.json()).sort(), ['credentials', 'github', 'google', 'linkedin']);
  assert.equal(config.session.strategy, 'jwt');
  const credentials = config.providers.find(provider => provider.id === 'credentials');
  const options = credentials.options ?? credentials;
  assert.equal(await options.authorize({}), null);
  const accessToken = `fixture.${Buffer.from(JSON.stringify({ sub: 'fixture-user' })).toString('base64url')}.fixture`;
  let requests = 0;
  globalThis.fetch = async (url, init) => {
    requests++;
    assert.equal(url, 'https://backend.invalid/api/auth/login');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { email: 'fixture@example.invalid', password: 'synthetic' });
    return Response.json({ access_token: accessToken, refresh_token: 'synthetic-refresh' });
  };
  const user = await options.authorize({ email: 'fixture@example.invalid', password: 'synthetic' });
  assert.equal(requests, 1);
  assert.equal(user.id, 'fixture-user');
  const token = await config.callbacks.jwt({ token: {}, user, account: { provider: 'credentials' } });
  const session = await config.callbacks.session({ session: { user: {} }, token });
  assert.equal(session.user.id, 'fixture-user');
  assert.equal(session.accessToken, accessToken);
  globalThis.fetch = async () => Response.json({ error: 'invalid fixture' }, { status: 401 });
  assert.equal(await options.authorize({ email: 'fixture@example.invalid', password: 'synthetic' }), null);
  console.log('Actual Auth.js provider handler, credentials and JWT/session callbacks passed offline.');
})().catch(error => { console.error(error); process.exitCode = 1; });
