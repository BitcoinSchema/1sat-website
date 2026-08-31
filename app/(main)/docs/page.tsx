"use client";

import {
	Check,
	Copy,
	ExternalLink,
	Plug,
	Shield,
	Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { highlight } from "sugar-high";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function CodeBlock({ code, title }: { code: string; title: string }) {
	const [copied, setCopied] = useState(false);
	const html = useMemo(() => highlight(code), [code]);

	return (
		<div className="group relative overflow-hidden rounded-lg border bg-muted/30">
			<div className="border-b px-4 py-2 font-mono text-muted-foreground text-xs">
				{title}
			</div>
			<button
				aria-label="Copy code"
				className="absolute top-2 right-2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				onClick={() => {
					void navigator.clipboard.writeText(code);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				}}
				type="button"
			>
				{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
			</button>
			<pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
				<code dangerouslySetInnerHTML={{ __html: html }} />
			</pre>
		</div>
	);
}

const walletMethods = [
	{
		group: "Actions",
		methods: [
			"createAction",
			"signAction",
			"abortAction",
			"listActions",
			"internalizeAction",
		],
	},
	{ group: "Outputs", methods: ["listOutputs", "relinquishOutput"] },
	{
		group: "Keys",
		methods: [
			"getPublicKey",
			"revealCounterpartyKeyLinkage",
			"revealSpecificKeyLinkage",
		],
	},
	{
		group: "Cryptography",
		methods: [
			"encrypt",
			"decrypt",
			"createHmac",
			"verifyHmac",
			"createSignature",
			"verifySignature",
		],
	},
	{
		group: "Certificates",
		methods: [
			"acquireCertificate",
			"listCertificates",
			"proveCertificate",
			"relinquishCertificate",
		],
	},
	{
		group: "Discovery",
		methods: ["discoverByIdentityKey", "discoverByAttributes"],
	},
	{
		group: "Session",
		methods: ["isAuthenticated", "waitForAuthentication"],
	},
	{
		group: "Chain",
		methods: ["getHeight", "getHeaderForHeight", "getNetwork", "getVersion"],
	},
];

export default function DocsPage() {
	return (
		<Page className="max-w-6xl">
			<PageHeader>
				<div>
					<PageTitle>BRC-100 Integration</PageTitle>
					<p className="mt-1 text-muted-foreground">
						Connect to 1Sat Wallet or any compatible wallet through the standard
						WalletInterface.
					</p>
				</div>
				<div className="ml-auto flex gap-4 text-sm">
					<Link
						className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
						href="https://github.com/b-open-io/1sat-sdk"
						target="_blank"
					>
						SDK <ExternalLink className="h-3 w-3" />
					</Link>
					<Link
						className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
						href="https://github.com/bitcoin-sv/BRCs/blob/master/wallet/0100.md"
						target="_blank"
					>
						BRC-100 <ExternalLink className="h-3 w-3" />
					</Link>
				</div>
			</PageHeader>
			<PageContent>
				<div className="space-y-12">
					<div className="grid gap-4 sm:grid-cols-3">
						<Card>
							<CardHeader>
								<Plug className="h-5 w-5 text-primary" />
								<CardTitle>Auto-detected</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									One call races desktop localhost, injected CWI, XDM, and React
									Native transports.
								</CardDescription>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Shield className="h-5 w-5 text-primary" />
								<CardTitle>Permissioned</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									The selected wallet owns keys, authentication, and every
									protocol, basket, certificate, and spending prompt.
								</CardDescription>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Smartphone className="h-5 w-5 text-primary" />
								<CardTitle>Mobile-ready</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>
									The same interface works in an embedded wallet browser; no
									vendor-specific application API is required.
								</CardDescription>
							</CardContent>
						</Card>
					</div>

					<section className="space-y-4" id="quick-start">
						<h2 className="font-semibold text-2xl">Quick start</h2>
						<CodeBlock
							code="bun add @1sat/connect @1sat/actions"
							title="Terminal"
						/>
						<CodeBlock
							code={`import { connectWallet, createWalletSession } from '@1sat/connect'

const result = await connectWallet({ autoDetect: true })
if (!result) throw new Error('No BRC-100 wallet available')

const { wallet, identityKey, provider } = result
console.log('Connected', { provider })

const session = createWalletSession(result)
session.on('disconnected', ({ reason }) => {
  console.log('Wallet disconnected:', reason)
})
session.start()

// Every provider returns the standard BRC-100 WalletInterface.
const { network } = await wallet.getNetwork({})
const { actions } = await wallet.listActions({ labels: [], limit: 25 })`}
							title="connect.ts"
						/>
						<p className="text-muted-foreground text-sm">
							The session checks <code>isAuthenticated</code> before reading the
							identity key, so a locked wallet does not receive repeated unlock
							prompts. Stop or disconnect the session when your application no
							longer needs it.
						</p>
					</section>

					<section className="space-y-4" id="web-wallet-provider">
						<h2 className="font-semibold text-2xl">
							Connect to the 1Sat web wallet
						</h2>
						<p className="text-muted-foreground">
							Add the hosted CWI iframe as a provider when you want a no-install
							mobile fallback. It participates in the same race as desktop and
							injected wallets.
						</p>
						<CodeBlock
							code={`const result = await connectWallet({
  autoDetect: true,
  providers: [{
    type: '1sat-web',
    name: '1Sat Web Wallet',
    url: 'https://1satwallet.com/wallet/cwi',
  }],
})`}
							title="web-provider.ts"
						/>
					</section>

					<section className="space-y-4" id="actions">
						<h2 className="font-semibold text-2xl">Build 1Sat features</h2>
						<p className="text-muted-foreground">
							Use <code>@1sat/actions</code> for ordinals, BSV21, OpNS,
							payments, identities, locks, collections, and message sync.
							Actions accept any standard wallet; they do not depend on how it
							connected.
						</p>
						<CodeBlock
							code={`import { createContext, deriveDepositAddresses, sendBsv } from '@1sat/actions'

const ctx = createContext(wallet, { chain: 'main' })
const { derivations } = await deriveDepositAddresses.execute(ctx, { count: 1 })

const payment = await sendBsv.execute(ctx, {
  requests: [{ address: '1...', satoshis: 1000 }],
})
if (payment.error) throw new Error(payment.error)`}
							title="actions.ts"
						/>
					</section>

					<section className="space-y-4" id="interface">
						<h2 className="font-semibold text-2xl">Complete WalletInterface</h2>
						<p className="text-muted-foreground">
							BRC-100 defines these 28 methods. Do not replace them with a
							smaller vendor RPC vocabulary; higher-level operations belong in
							actions.
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							{walletMethods.map(({ group, methods }) => (
								<Card key={group}>
									<CardHeader className="pb-2">
										<CardTitle className="text-base">{group}</CardTitle>
									</CardHeader>
									<CardContent className="flex flex-wrap gap-2">
										{methods.map((method) => (
											<code
												className="rounded bg-muted px-2 py-1 text-xs"
												key={method}
											>
												{method}
											</code>
										))}
									</CardContent>
								</Card>
							))}
						</div>
					</section>
				</div>
			</PageContent>
		</Page>
	);
}
