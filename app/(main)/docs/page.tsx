"use client";

import {
	ArrowRight,
	Check,
	Copy,
	ExternalLink,
	Hash,
	Plug,
	Shield,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { highlight } from "sugar-high";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Code block with copy button
// ---------------------------------------------------------------------------

function CodeBlock({
	code,
	lang = "typescript",
	title,
}: {
	code: string;
	lang?: string;
	title?: string;
}) {
	const [copied, setCopied] = useState(false);
	const html = useMemo(() => highlight(code), [code]);

	const copy = useCallback(() => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	return (
		<div className="group relative border border-border bg-muted/40">
			{title && (
				<div className="flex items-center justify-between border-border border-b px-4 py-2 font-mono text-muted-foreground text-xs">
					<span>{title}</span>
					<span className="uppercase tracking-widest opacity-50">{lang}</span>
				</div>
			)}
			<button
				aria-label="Copy code"
				className="absolute top-2 right-2 p-1.5 text-muted-foreground opacity-0 transition-colors hover:text-foreground group-hover:opacity-100"
				onClick={copy}
				type="button"
			>
				{copied ? (
					<Check className="size-3.5" />
				) : (
					<Copy className="size-3.5" />
				)}
			</button>
			<pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high output is safe */}
				<code dangerouslySetInnerHTML={{ __html: html }} />
			</pre>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Table of contents (scrollspy)
// ---------------------------------------------------------------------------

const sections = [
	{ id: "getting-started", label: "Getting Started" },
	{ id: "detect-provider", label: "Detect Provider" },
	{ id: "connect", label: "Connect" },
	{ id: "challenge-signing", label: "Challenge Signing" },
	{ id: "addresses", label: "Get Addresses" },
	{ id: "balance", label: "Get Balance" },
	{ id: "send-bsv", label: "Sign Transaction" },
	{ id: "sign-message", label: "Sign Message" },
	{ id: "ordinals", label: "Ordinals" },
	{ id: "tokens", label: "Tokens" },
	{ id: "listings", label: "Listings" },
	{ id: "events", label: "Events" },
	{ id: "errors", label: "Error Handling" },
	{ id: "types", label: "Types Reference" },
] as const;

function TableOfContents() {
	const [active, setActive] = useState<string>(sections[0].id);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActive(entry.target.id);
					}
				}
			},
			{ rootMargin: "-20% 0px -60% 0px", threshold: 0 },
		);

		for (const s of sections) {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	}, []);

	return (
		<nav className="sticky top-6 space-y-1">
			<p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
				On this page
			</p>
			{sections.map((s) => (
				<a
					className={`block py-1 text-sm transition-colors ${
						active === s.id
							? "font-medium text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
					href={`#${s.id}`}
					key={s.id}
				>
					{s.label}
				</a>
			))}
		</nav>
	);
}

// ---------------------------------------------------------------------------
// Section heading with anchor
// ---------------------------------------------------------------------------

function SectionHeading({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) {
	return (
		<h2
			className="group flex scroll-mt-6 items-center gap-2 font-bold text-xl tracking-tight"
			id={id}
		>
			<a
				className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
				href={`#${id}`}
			>
				<Hash className="size-4" />
			</a>
			{children}
		</h2>
	);
}

function SubHeading({
	id,
	children,
}: {
	id?: string;
	children: React.ReactNode;
}) {
	return (
		<h3
			className="scroll-mt-6 font-semibold text-base text-foreground/90 tracking-tight"
			id={id}
		>
			{children}
		</h3>
	);
}

// ---------------------------------------------------------------------------
// Method signature display
// ---------------------------------------------------------------------------

function MethodSig({
	name,
	params,
	returns,
	badge,
}: {
	name: string;
	params?: string;
	returns: string;
	badge?: "read" | "write" | "connection";
}) {
	const badgeColor = {
		read: "bg-chart-4/20 text-chart-4 border-chart-4/30",
		write: "bg-primary/15 text-primary border-primary/30",
		connection: "bg-chart-3/20 text-chart-3 border-chart-3/30",
	};

	return (
		<div className="flex items-start gap-3 border border-border bg-muted/30 px-4 py-3">
			<code className="font-mono font-semibold text-foreground text-sm">
				{name}({params || ""})
			</code>
			<ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
			<code className="font-mono text-muted-foreground text-sm">{returns}</code>
			{badge && (
				<Badge
					className={`ml-auto text-[10px] uppercase tracking-wider ${badgeColor[badge]}`}
					variant="outline"
				>
					{badge}
				</Badge>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
	return (
		<Page className="max-w-7xl">
			<PageHeader>
				<div>
					<PageTitle>Developer Documentation</PageTitle>
					<p className="mt-1 text-muted-foreground">
						Integrate 1Sat Wallet into your application via the provider API
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link
						className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
						href="https://github.com/b-open-io/1sat-sdk"
						rel="noopener noreferrer"
						target="_blank"
					>
						SDK
						<ExternalLink className="size-3" />
					</Link>
					<Link
						className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
						href="https://www.npmjs.com/package/@1sat/connect"
						rel="noopener noreferrer"
						target="_blank"
					>
						npm
						<ExternalLink className="size-3" />
					</Link>
				</div>
			</PageHeader>

			<PageContent>
				<div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_200px]">
					{/* Main content */}
					<div className="min-w-0 space-y-12">
						{/* Hero cards */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<Card className="border-primary/20">
								<CardHeader className="pb-2">
									<Plug className="size-5 text-primary" />
									<CardTitle className="text-sm">Connect</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription>
										Popup-based wallet connection. No extension required.
									</CardDescription>
								</CardContent>
							</Card>
							<Card className="border-primary/20">
								<CardHeader className="pb-2">
									<Shield className="size-5 text-primary" />
									<CardTitle className="text-sm">Secure</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription>
										User approves every action. Keys never leave the wallet.
									</CardDescription>
								</CardContent>
							</Card>
							<Card className="border-primary/20">
								<CardHeader className="pb-2">
									<Zap className="size-5 text-primary" />
									<CardTitle className="text-sm">Full Featured</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription>
										NFTs, tokens, listings, signing, and transaction building.
									</CardDescription>
								</CardContent>
							</Card>
						</div>

						{/* Getting Started */}
						<section className="space-y-4">
							<SectionHeading id="getting-started">
								Getting Started
							</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								1Sat Wallet exposes a provider API that lets any web application
								request wallet operations from the user. The wallet opens as a
								popup at{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									1sat.market
								</code>{" "}
								where the user approves or rejects each request. No browser
								extension is required.
							</p>

							<SubHeading>Install</SubHeading>
							<CodeBlock code="bun add @1sat/connect" lang="bash" />

							<SubHeading>Quick Start</SubHeading>
							<CodeBlock
								code={`import { createOneSat } from '@1sat/connect'

const wallet = createOneSat({
  appName: 'My dApp',
})

// Connect — opens wallet popup for user approval
const { paymentAddress, ordinalAddress } = await wallet.connect()
console.log('Connected:', paymentAddress)

// Get balance
const { satoshis } = await wallet.getBalance()
console.log('Balance:', satoshis, 'sats')

// Inscribe data
const { txid } = await wallet.inscribe({
  dataB64: btoa('Hello, Ordinals!'),
  contentType: 'text/plain',
})
console.log('Inscribed:', txid)`}
								title="app.ts"
							/>
						</section>

						{/* Detect Provider */}
						<section className="space-y-4">
							<SectionHeading id="detect-provider">
								Detecting the Provider
							</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								The{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									createOneSat()
								</code>{" "}
								factory handles provider detection automatically. It checks for
								a browser extension first (
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									window.onesat
								</code>
								), then falls back to the popup-based provider.
							</p>
							<CodeBlock
								code={`import { createOneSat, isOneSatInjected, waitForOneSat } from '@1sat/connect'

// Recommended: auto-detects extension or uses popup
const wallet = createOneSat({ appName: 'My dApp' })

// Manual detection
if (isOneSatInjected()) {
  // Browser extension is installed
  const wallet = window.onesat
} else {
  // No extension — popup provider will be used
}

// Wait for extension injection (useful on page load)
try {
  const wallet = await waitForOneSat(3000) // 3s timeout
} catch {
  // Extension not installed
}`}
							/>
						</section>

						{/* Connect */}
						<section className="space-y-4">
							<SectionHeading id="connect">
								Establishing a Connection
							</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								Calling{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									connect()
								</code>{" "}
								opens the wallet popup where the user can approve the
								connection. On approval, you receive the user's payment address,
								ordinal address, and identity public key. You can optionally
								pass a{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									challenge
								</code>{" "}
								to get a BSM signature in the same popup — see{" "}
								<a className="text-primary underline" href="#challenge-signing">
									Challenge Signing
								</a>{" "}
								below.
							</p>
							<MethodSig
								badge="connection"
								name="connect"
								params="params?: ConnectParams"
								returns="Promise<ConnectResult>"
							/>
							<CodeBlock
								code={`try {
  const { paymentAddress, ordinalAddress, identityPubKey } = await wallet.connect()
  console.log('Payment:', paymentAddress)
  console.log('Ordinal:', ordinalAddress)
  console.log('Identity:', identityPubKey)
} catch (err) {
  if (err instanceof UserRejectedError) {
    console.log('User closed the popup')
  }
}`}
							/>

							<SubHeading>Disconnect</SubHeading>
							<MethodSig
								badge="connection"
								name="disconnect"
								returns="Promise<void>"
							/>
							<CodeBlock
								code={`await wallet.disconnect()
// Session cleared — user must re-approve to connect again`}
							/>

							<SubHeading>Check Connection</SubHeading>
							<MethodSig badge="read" name="isConnected" returns="boolean" />
							<CodeBlock
								code={`if (wallet.isConnected()) {
  // Wallet is connected, safe to call methods
}`}
							/>
						</section>

						{/* Challenge Signing */}
						<section className="space-y-4">
							<SectionHeading id="challenge-signing">
								Challenge Signing
							</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								When your app needs to verify wallet ownership (e.g. during
								authentication), pass a{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									challenge
								</code>{" "}
								string to{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									connect()
								</code>
								. The wallet signs the challenge with BSM during the same popup
								interaction, so the user only sees one popup instead of two.
								This avoids browsers blocking a second{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									window.open
								</code>{" "}
								call.
							</p>
							<CodeBlock
								code={`import { createOneSat, PopupBlockedError } from '@1sat/connect'

const wallet = createOneSat({ appName: 'My dApp' })

// Build a challenge for your server to verify
const timestamp = new Date().toISOString()
const challenge = \`/api/auth|$\{timestamp}\`

// Single popup: connect + sign in one user gesture
const result = await wallet.connect({ challenge })

console.log('Payment:', result.paymentAddress)
console.log('Ordinal:', result.ordinalAddress)

// signedMessage is present when a challenge was provided
if (result.signedMessage) {
  console.log('Signature:', result.signedMessage.signature)
  console.log('Address:', result.signedMessage.address)
  console.log('Message:', result.signedMessage.message)

  // Send to your server for BSM verification
  await fetch('/api/auth', {
    method: 'POST',
    body: JSON.stringify({
      address: result.signedMessage.address,
      signature: result.signedMessage.signature,
      message: challenge,
    }),
  })
}`}
								title="Challenge + Connect in one popup"
							/>
							<p className="text-muted-foreground leading-relaxed">
								If no{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									challenge
								</code>{" "}
								is provided,{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									signedMessage
								</code>{" "}
								will be{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									undefined
								</code>{" "}
								and the popup behaves exactly as before — fully backward
								compatible.
							</p>
						</section>

						{/* Addresses */}
						<section className="space-y-4">
							<SectionHeading id="addresses">
								Getting Addresses &amp; Keys
							</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								After connecting, retrieve the user's addresses and identity key
								at any time.
							</p>
							<MethodSig
								badge="read"
								name="getAddresses"
								returns="{ paymentAddress, ordinalAddress } | null"
							/>
							<MethodSig
								badge="read"
								name="getIdentityPubKey"
								returns="string | null"
							/>
							<CodeBlock
								code={`const addrs = wallet.getAddresses()
if (addrs) {
  console.log('Payment:', addrs.paymentAddress)
  console.log('Ordinal:', addrs.ordinalAddress)
}

const identityPubKey = wallet.getIdentityPubKey()
// Use for identity verification, BAP, or encryption`}
							/>
						</section>

						{/* Balance */}
						<section className="space-y-4">
							<SectionHeading id="balance">Get Balance</SectionHeading>
							<MethodSig
								badge="read"
								name="getBalance"
								returns="Promise<BalanceResult>"
							/>
							<CodeBlock
								code={`const { satoshis, usd } = await wallet.getBalance()
console.log(\`\${satoshis} sats ($\${usd?.toFixed(2)} USD)\`)`}
							/>
						</section>

						{/* Sign Transaction */}
						<section className="space-y-4">
							<SectionHeading id="send-bsv">Sign Transaction</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								Submit a raw transaction hex for the user to review and sign.
								The wallet shows a summary of inputs and outputs before the user
								approves.
							</p>
							<MethodSig
								badge="write"
								name="signTransaction"
								params="request: SignTransactionRequest"
								returns="Promise<SignTransactionResult>"
							/>
							<CodeBlock
								code={`const { rawtx, txid } = await wallet.signTransaction({
  rawtx: '0100000001...',       // Unsigned transaction hex
  description: 'Send 0.01 BSV', // Shown to user in approval popup
})
console.log('Signed TXID:', txid)`}
							/>
						</section>

						{/* Sign Message */}
						<section className="space-y-4">
							<SectionHeading id="sign-message">Sign Message</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								Request a Bitcoin Signed Message (BSM) from the user. Useful for
								authentication, attestation, and identity verification.
							</p>
							<MethodSig
								badge="write"
								name="signMessage"
								params="message: string"
								returns="Promise<SignMessageResult>"
							/>
							<CodeBlock
								code={`const { message, signature, address } = await wallet.signMessage('Authenticate to My dApp')
console.log('Signature:', signature)
console.log('Signed by:', address)

// Verify server-side with @bsv/sdk BSM verification`}
							/>
						</section>

						{/* Ordinals */}
						<section className="space-y-4">
							<SectionHeading id="ordinals">Ordinals</SectionHeading>

							<SubHeading>Inscribe</SubHeading>
							<MethodSig
								badge="write"
								name="inscribe"
								params="request: InscribeRequest"
								returns="Promise<InscribeResult>"
							/>
							<CodeBlock
								code={`// Inscribe text
const { txid, origin } = await wallet.inscribe({
  dataB64: btoa('Hello, Ordinals!'),
  contentType: 'text/plain',
})

// Inscribe an image
const file = document.querySelector('input[type=file]').files[0]
const reader = new FileReader()
reader.onload = async () => {
  const dataB64 = reader.result.split(',')[1]
  const { txid } = await wallet.inscribe({
    dataB64,
    contentType: file.type,
  })
}
reader.readAsDataURL(file)

// Inscribe with MAP metadata
const { txid } = await wallet.inscribe({
  dataB64: btoa('Content here'),
  contentType: 'text/plain',
  metaData: {
    app: 'my-app',
    type: 'post',
    context: 'channel-id',
  },
})`}
							/>

							<SubHeading>Get Ordinals</SubHeading>
							<MethodSig
								badge="read"
								name="getOrdinals"
								params="options?: ListOptions"
								returns="Promise<OrdinalOutput[]>"
							/>
							<CodeBlock
								code={`// Get first 20 ordinals
const ordinals = await wallet.getOrdinals({ limit: 20 })

for (const ord of ordinals) {
  console.log(ord.outpoint, ord.contentType)
}

// Paginate
const page2 = await wallet.getOrdinals({ limit: 20, offset: 20 })`}
							/>

							<SubHeading>Transfer Ordinals</SubHeading>
							<MethodSig
								badge="write"
								name="sendOrdinals"
								params="request: SendOrdinalsRequest"
								returns="Promise<SendResult>"
							/>
							<CodeBlock
								code={`const { txid } = await wallet.sendOrdinals({
  outpoints: ['abc123_0', 'def456_0'], // Ordinal outpoints to send
  destinationAddress: '1RecipientAddress...',
})`}
							/>
						</section>

						{/* Tokens */}
						<section className="space-y-4">
							<SectionHeading id="tokens">Tokens</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								Transfer BSV20 (tick-based) and BSV21 (contract-based) fungible
								tokens.
							</p>

							<SubHeading>Get Tokens</SubHeading>
							<MethodSig
								badge="read"
								name="getTokens"
								params="options?: ListOptions"
								returns="Promise<TokenOutput[]>"
							/>
							<CodeBlock
								code={`const tokens = await wallet.getTokens()

for (const tok of tokens) {
  console.log(tok.symbol, tok.amount, tok.tokenId)
}`}
							/>

							<SubHeading>Transfer Tokens</SubHeading>
							<MethodSig
								badge="write"
								name="transferToken"
								params="request: TransferTokenRequest"
								returns="Promise<SendResult>"
							/>
							<CodeBlock
								code={`const { txid } = await wallet.transferToken({
  tokenId: 'token-origin-txid_0',
  amount: '100',
  destinationAddress: '1RecipientAddress...',
})`}
							/>
						</section>

						{/* Listings */}
						<section className="space-y-4">
							<SectionHeading id="listings">
								Marketplace Listings
							</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								Create, purchase, and cancel trustless OrdLock marketplace
								listings.
							</p>

							<SubHeading>Create Listing</SubHeading>
							<MethodSig
								badge="write"
								name="createListing"
								params="request: CreateListingRequest"
								returns="Promise<ListingResult>"
							/>
							<CodeBlock
								code={`const { txid, listingOutpoints } = await wallet.createListing({
  outpoints: ['abc123_0'],  // Ordinals to list
  priceSatoshis: 100000,    // Price in satoshis
})`}
							/>

							<SubHeading>Purchase Listing</SubHeading>
							<MethodSig
								badge="write"
								name="purchaseListing"
								params="request: PurchaseListingRequest"
								returns="Promise<SendResult>"
							/>
							<CodeBlock
								code={`const { txid } = await wallet.purchaseListing({
  listingOutpoint: 'listing-txid_0',
})`}
							/>

							<SubHeading>Cancel Listing</SubHeading>
							<MethodSig
								badge="write"
								name="cancelListing"
								params="request: CancelListingRequest"
								returns="Promise<SendResult>"
							/>
							<CodeBlock
								code={`const { txid } = await wallet.cancelListing({
  listingOutpoints: ['listing-txid_0'],
})`}
							/>
						</section>

						{/* Events */}
						<section className="space-y-4">
							<SectionHeading id="events">Events</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								Listen for wallet state changes. Always handle these events to
								keep your app in sync with the wallet.
							</p>

							<div className="divide-y divide-border border border-border">
								<div className="grid grid-cols-[140px_1fr] text-sm">
									<div className="bg-muted/30 px-4 py-2.5 font-mono font-semibold">
										connect
									</div>
									<div className="px-4 py-2.5 text-muted-foreground">
										User approved connection. Receives{" "}
										<code className="bg-muted px-1 py-0.5 font-mono text-xs">
											ConnectResult
										</code>
									</div>
								</div>
								<div className="grid grid-cols-[140px_1fr] text-sm">
									<div className="bg-muted/30 px-4 py-2.5 font-mono font-semibold">
										disconnect
									</div>
									<div className="px-4 py-2.5 text-muted-foreground">
										User disconnected or session expired
									</div>
								</div>
								<div className="grid grid-cols-[140px_1fr] text-sm">
									<div className="bg-muted/30 px-4 py-2.5 font-mono font-semibold">
										accountChange
									</div>
									<div className="px-4 py-2.5 text-muted-foreground">
										User switched account. Receives updated addresses.
									</div>
								</div>
							</div>

							<CodeBlock
								code={`// Subscribe to events
wallet.on('connect', ({ paymentAddress, ordinalAddress }) => {
  console.log('Connected:', paymentAddress)
})

wallet.on('disconnect', () => {
  console.log('Disconnected')
  // Clear local state, show connect button
})

wallet.on('accountChange', ({ paymentAddress, ordinalAddress }) => {
  console.log('Account switched:', paymentAddress)
  // Refresh balances, ordinals, etc.
})

// Unsubscribe
const handler = (data) => console.log(data)
wallet.on('connect', handler)
wallet.off('connect', handler)`}
							/>
						</section>

						{/* Error Handling */}
						<section className="space-y-4">
							<SectionHeading id="errors">Error Handling</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								All methods return promises. Errors use typed classes with
								numeric codes for reliable programmatic handling.
							</p>
							<CodeBlock
								code={`import {
  UserRejectedError,
  TimeoutError,
  InsufficientFundsError,
  WalletLockedError,
  WalletNotConnectedError,
  PopupBlockedError,
} from '@1sat/connect'

try {
  await wallet.connect()
} catch (err) {
  if (err instanceof UserRejectedError) {
    // User closed popup or clicked reject
  } else if (err instanceof TimeoutError) {
    // Request timed out (default 5 minutes)
  } else if (err instanceof PopupBlockedError) {
    // Browser blocked the popup — prompt user to allow popups
  } else if (err instanceof WalletLockedError) {
    // Wallet is locked — user needs to unlock
  } else if (err instanceof WalletNotConnectedError) {
    // Called a method before connecting
  } else if (err instanceof InsufficientFundsError) {
    // Not enough BSV for the operation
  }
}`}
							/>

							<div className="divide-y divide-border border border-border">
								<div className="grid grid-cols-[260px_60px_1fr] font-mono text-sm">
									<div className="bg-muted/50 px-4 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Error Class
									</div>
									<div className="bg-muted/50 px-4 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Code
									</div>
									<div className="bg-muted/50 px-4 py-2 font-sans font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										When
									</div>
								</div>
								{[
									["UserRejectedError", "4001", "User rejected the request"],
									["WalletLockedError", "4002", "Wallet is locked"],
									["WalletNotConnectedError", "4003", "Not connected"],
									["InsufficientFundsError", "4004", "Not enough BSV"],
									[
										"PopupBlockedError",
										"4006",
										"Browser blocked the popup window",
									],
									["PopupClosedError", "4007", "Popup was closed unexpectedly"],
									["TimeoutError", "4008", "Request exceeded timeout"],
								].map(([cls, code, desc]) => (
									<div
										className="grid grid-cols-[260px_60px_1fr] text-sm"
										key={code}
									>
										<div className="px-4 py-2 font-mono">{cls}</div>
										<div className="px-4 py-2 font-mono text-muted-foreground">
											{code}
										</div>
										<div className="px-4 py-2 font-sans text-muted-foreground">
											{desc}
										</div>
									</div>
								))}
							</div>
						</section>

						{/* Types Reference */}
						<section className="space-y-4">
							<SectionHeading id="types">Types Reference</SectionHeading>
							<p className="text-muted-foreground leading-relaxed">
								All types are exported from{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									@1sat/connect
								</code>{" "}
								for TypeScript projects.
							</p>
							<CodeBlock
								code={`interface OneSatConfig {
  appName?: string        // Shown in approval popup
  popupUrl?: string       // Default: 'https://www.1satwallet.com'
  timeout?: number        // Default: 300000 (5 min)
  network?: 'main' | 'test'
}

interface ConnectParams {
  challenge?: string      // Optional BSM challenge signed in same popup
}

interface ConnectResult {
  paymentAddress: string
  ordinalAddress: string
  identityPubKey: string
  signedMessage?: SignMessageResult  // Present when challenge was provided
}

interface BalanceResult {
  satoshis: number
  usd?: number
}

interface SignTransactionRequest {
  rawtx: string
  description?: string
}

interface SignTransactionResult {
  rawtx: string
  txid: string
}

interface SignMessageResult {
  message: string
  signature: string
  address: string
}

interface InscribeRequest {
  dataB64: string
  contentType: string
  destinationAddress?: string
  metaData?: Record<string, string>
}

interface InscribeResult {
  txid: string
  origin: string
}

interface SendOrdinalsRequest {
  outpoints: string[]
  destinationAddress: string
}

interface TransferTokenRequest {
  tokenId: string
  amount: string
  destinationAddress: string
}

interface CreateListingRequest {
  outpoints: string[]
  priceSatoshis: number
}

interface ListingResult {
  txid: string
  listingOutpoints: string[]
}

interface PurchaseListingRequest {
  listingOutpoint: string
}

interface CancelListingRequest {
  listingOutpoints: string[]
}

interface SendResult {
  txid: string
}

interface OrdinalOutput {
  outpoint: string
  satoshis: number
  origin?: string
  contentType?: string
}

interface TokenOutput {
  outpoint: string
  satoshis: number
  tokenId: string
  amount: string
  symbol?: string
}

interface Utxo {
  txid: string
  vout: number
  satoshis: number
  script: string
}

interface ListOptions {
  limit?: number
  offset?: number
}

type OneSatEvent = 'connect' | 'disconnect' | 'accountChange'`}
								title="types.ts"
							/>

							<SubHeading>Global Declaration</SubHeading>
							<p className="text-muted-foreground leading-relaxed">
								If you access{" "}
								<code className="bg-muted px-1.5 py-0.5 font-mono text-sm">
									window.onesat
								</code>{" "}
								directly (e.g. with a browser extension), add this declaration
								to your project:
							</p>
							<CodeBlock
								code={`import type { OneSatProvider } from '@1sat/connect'

declare global {
  interface Window {
    onesat?: OneSatProvider
  }
}`}
								title="global.d.ts"
							/>
						</section>
					</div>

					{/* Sidebar TOC — desktop only */}
					<aside className="hidden lg:block">
						<TableOfContents />
					</aside>
				</div>
			</PageContent>
		</Page>
	);
}
