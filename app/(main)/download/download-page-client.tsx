import { Check, Smartphone, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TESTFLIGHT_APP_URL = "https://apps.apple.com/app/testflight/id899247664";

function AppleLogo({ className }: { className?: string }) {
	return (
		<svg
			data-icon="inline-start"
			viewBox="0 0 384 512"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
		</svg>
	);
}

export function AppleAppPage() {
	return (
		<div className="relative">
			<section className="pt-16 md:pt-24 pb-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
							1Sat for <span className="text-primary">Apple</span>
						</h1>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
							Native wallet for iPhone, iPad, and Mac. Face ID unlocks the app.
							iCloud Keychain holds the seed.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
							<Button size="lg" className="gap-3 h-14 px-8 text-base" asChild>
								<a href={TESTFLIGHT_APP_URL}>
									<AppleLogo className="h-5 w-5" />
									<div className="text-left">
										<div className="text-xs opacity-80">Get</div>
										<div className="font-semibold">TestFlight</div>
									</div>
								</a>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="gap-3 h-14 px-8 text-base"
								asChild
							>
								<Link href="/wallet/create">
									<Wallet className="h-5 w-5" data-icon="inline-start" />
									<div className="text-left">
										<div className="text-xs opacity-80">Use the</div>
										<div className="font-semibold">Browser Wallet</div>
									</div>
								</Link>
							</Button>
						</div>

						<p className="text-sm text-muted-foreground">
							The Apple app is a TestFlight beta. Install TestFlight, then open
							1Sat Wallet.
						</p>
					</div>
				</div>
			</section>

			<section className="py-16 bg-muted/30">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						Get the Apple app in 3 steps
					</h2>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
								1
							</div>
							<h3 className="font-semibold mb-2">Install TestFlight</h3>
							<p className="text-sm text-muted-foreground">
								Get TestFlight from the App Store on iPhone, iPad, or Mac.
							</p>
						</div>

						<div className="text-center">
							<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
								2
							</div>
							<h3 className="font-semibold mb-2">Open 1Sat Wallet</h3>
							<p className="text-sm text-muted-foreground">
								Find 1Sat Wallet in TestFlight and install it.
							</p>
						</div>

						<div className="text-center">
							<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
								3
							</div>
							<h3 className="font-semibold mb-2">Create or restore</h3>
							<p className="text-sm text-muted-foreground">
								Make a new wallet, or restore a phrase. Face ID locks the app.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						Two wallets. Pick one.
					</h2>

					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						<div className="rounded-xl border bg-card p-6">
							<div className="flex items-center gap-3 mb-3">
								<Wallet className="h-5 w-5 text-primary" />
								<h3 className="font-semibold">Browser Wallet</h3>
							</div>
							<p className="text-sm text-muted-foreground">
								Runs in this site. Keys stay in this browser. Create a wallet
								now. No install.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<div className="flex items-center gap-3 mb-3">
								<Smartphone className="h-5 w-5 text-primary" />
								<h3 className="font-semibold">Apple App</h3>
							</div>
							<p className="text-sm text-muted-foreground">
								Native Swift app. Face ID unlocks it. iCloud Keychain holds the
								seed, so a new iPhone with the same Apple ID can open the same
								wallet.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 bg-muted/30">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						What the Apple app does
					</h2>

					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">Face ID lock</h3>
							<p className="text-sm text-muted-foreground">
								The app asks Face ID before it reads the seed. Your phrase is
								not sitting in a file.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">iCloud Keychain</h3>
							<p className="text-sm text-muted-foreground">
								Apple stores ciphertext it cannot read. A new device with the
								same Apple ID can restore the wallet.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">Accounts as cards</h3>
							<p className="text-sm text-muted-foreground">
								Each account is a whole wallet with its own identity key.
								Ordinals, tokens, and names sit beside your money.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">iPhone, iPad, and Mac</h3>
							<p className="text-sm text-muted-foreground">
								One Apple app. Install it from TestFlight. There is no separate
								desktop installer.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						What you need
					</h2>

					<div className="max-w-sm mx-auto">
						<div className="rounded-xl border bg-card p-6">
							<div className="flex items-center gap-3 mb-4">
								<AppleLogo className="h-5 w-5" />
								<h3 className="font-semibold">Apple</h3>
							</div>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									iPhone, iPad, or Mac
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									TestFlight
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									Face ID or Touch ID
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 bg-muted/30">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">FAQ</h2>

					<div className="space-y-6">
						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								Is the browser wallet the same as the Apple app?
							</h3>
							<p className="text-sm text-muted-foreground">
								No. They are two wallets. Keys do not move between them unless
								you restore the same phrase.
							</p>
						</div>

						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">How do I get the Apple app?</h3>
							<p className="text-sm text-muted-foreground">
								Install TestFlight, then open 1Sat Wallet from TestFlight. There
								is no Mac disk image and no Windows build.
							</p>
						</div>

						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								Where does the Apple app keep keys?
							</h3>
							<p className="text-sm text-muted-foreground">
								iCloud Keychain holds the seed. Face ID unlocks the app before
								it reads that seed.
							</p>
						</div>

						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								Can I use the Apple app on a Mac?
							</h3>
							<p className="text-sm text-muted-foreground">
								Yes. Install the same TestFlight app on a Mac. It is the Apple
								app, not a separate desktop product.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold mb-4">
							Start with the wallet you have
						</h2>
						<p className="text-muted-foreground mb-8">
							Open the Apple app from TestFlight, or create a wallet in this
							browser.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Button size="lg" className="gap-2" asChild>
								<a href={TESTFLIGHT_APP_URL}>
									<AppleLogo className="h-5 w-5" />
									Open TestFlight
								</a>
							</Button>
							<Button variant="outline" size="lg" className="gap-2" asChild>
								<Link href="/wallet/create">
									<Wallet className="h-4 w-4" data-icon="inline-start" />
									Browser Wallet
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
