# Hosted CWI session security

The hosted bridge uses the public BRC-100 CWI request/response shape at the
dApp boundary and an internal, mandatory v3 envelope between the iframe and
wallet tab.

Each iframe creates a 256-bit browser-CSPRNG capability. A session is the exact
tuple `(sessionId, sessionToken, browserOrigin, originator, leaderId)`:

- `browserOrigin` is the full normalized postMessage origin, including scheme
  and non-default port.
- `originator` is the canonical lowercase hostname passed to BRC-100 and
  BRC-116 permission evaluation.
- `leaderId` belongs to the wallet tab holding the Web Locks API leader lock.

The relay accepts requests and permission decisions only when every tuple
field matches its session record and its current leader ID. Responses and
permission prompts carry the same tuple. Legacy unscoped v1/v2 messages are
ignored. This isolates honest concurrent sessions and rejects blind forgery,
but it is not an authenticated confidential channel.

Limits are 1 MiB per channel message, 8 pending requests per session, 32
globally, and 4,096 unique request IDs per session. Duplicate IDs are rejected.
Wallet calls are serialized so an asynchronous WPM permission callback always
has one session owner.

The bridge refreshes its session every four seconds. Web Locks releases
leadership automatically when a tab exits, allowing the next wallet tab to
accept existing sessions. In-flight requests fail on leader loss and must be
retried by the dApp; they are never replayed automatically because a wallet
operation may already have produced a side effect.

## Unresolved same-origin threat

`BroadcastChannel` delivers every message to every participant on the wallet
origin. The session capability and complete ownership tuple are therefore
visible to a passive same-origin participant. After observing them, that
participant can forge a request, permission decision, or response that passes
the current tuple checks. The capability protects only against blind forgery;
it does not satisfy authentication when same-origin participants are
untrusted.

Ephemeral WebCrypto ECDH followed by AES-GCM with directional counters would
hide and authenticate traffic against passive listeners. It is not sufficient
by itself: an active same-origin participant can replace the unauthenticated
ECDH handshake and act as a man in the middle. Web Locks election is also not
an identity proof because any same-origin participant can request the named
lock.

The complete fix needs a trust anchor outside the broadcast channel. The
smallest viable protocol is:

1. Enroll a wallet-relay signing public key with a trusted 1Sat service during
   built-in wallet setup. Keep the signing operation behind the unlocked wallet
   boundary.
2. The iframe generates an ephemeral P-256 ECDH key and challenge.
3. The elected wallet tab generates its own ephemeral ECDH key and signs both
   public keys, the challenge, full browser origin, canonical FQDN, session ID,
   and leader ID.
4. The iframe verifies a server-signed enrollment assertion using a 1Sat key
   pinned in the application, then verifies the wallet-tab transcript
   signature.
5. Both sides derive directional AES-GCM keys with HKDF. Every subsequent
   message uses a strictly increasing counter as authenticated additional data;
   replay, gaps, wrong direction, or authentication failure tears down the
   session.
6. Key rotation, revocation, expiry, leader takeover, and recovery all require
   a newly signed transcript. No plaintext compatibility path remains.

Until that trust anchor and encrypted protocol exist, hosted CWI must be
treated as experimental and OPL-3958 must remain incomplete.

### Follow-up issue text

**Title:** Add trust-anchored encrypted hosted CWI transport

**Description:** Replace plaintext CWI v3 BroadcastChannel envelopes with an
authenticated WebCrypto session. Add wallet-relay signing-key enrollment and
revocation, a server-signed assertion verifiable from the iframe, signed
ephemeral P-256 ECDH transcripts bound to session ID, full browser origin,
canonical BRC-100 FQDN, and Web Locks leader ID, then derive directional
AES-GCM keys with HKDF and strict counters. Remove plaintext fallback. Prove
that a same-origin participant observing and actively injecting handshake and
traffic cannot read, forge, replay, reroute, or take over requests, permission
decisions, prompts, or responses, including leader loss and key rotation.
