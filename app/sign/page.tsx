'use client'

import { P2PKH, PrivateKey, Script, Transaction } from '@bsv/sdk'
import {
	AlertTriangle,
	CheckCircle,
	ExternalLink,
	FileText,
	Loader2,
	X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	ErrorCodes,
	parsePopupParams,
	rejectRequest,
	sendErrorResponse,
	sendResponse,
	walletLockedError,
} from '@1sat/connect'
import { useWallet } from '@/providers/wallet-provider'

interface SignTransactionParams {
	rawtx: string
	description?: string
}

/**
 * Sign a transaction using wallet keys
 * Signs all inputs that match our wallet addresses
 *
 * Note: This expects the transaction to have sourceTransaction attached to inputs,
 * or the inputs to already have unlockingScriptTemplate set
 */
async function signTransactionWithKeys(
	rawtx: string,
	payPk: string,
	ordPk: string
): Promise<{ rawtx: string; txid: string }> {
	const tx = Transaction.fromHex(rawtx)

	const payKey = PrivateKey.fromWif(payPk)
	const ordKey = PrivateKey.fromWif(ordPk)
	const payAddress = payKey.toAddress().toString()
	const ordAddress = ordKey.toAddress().toString()

	const p2pkh = new P2PKH()

	// Sign each input
	for (let i = 0; i < tx.inputs.length; i++) {
		const input = tx.inputs[i]

		// Skip if already has unlocking script
		if (input.unlockingScript && input.unlockingScript.toHex().length > 0) {
			continue
		}

		// Skip if already has unlocking template
		if (input.unlockingScriptTemplate) {
			continue
		}

		// Get source output info from the input
		const sourceTransaction = input.sourceTransaction
		if (sourceTransaction && input.sourceOutputIndex !== undefined) {
			const sourceOutput = sourceTransaction.outputs[input.sourceOutputIndex]
			if (sourceOutput) {
				const lockingScript = sourceOutput.lockingScript
				const lockingHex = lockingScript.toHex()
				const satoshis = sourceOutput.satoshis ?? 0

				// Check which address this output belongs to
				const payLockScript = p2pkh.lock(payAddress).toHex()
				const ordLockScript = p2pkh.lock(ordAddress).toHex()

				if (lockingHex === payLockScript) {
					input.unlockingScriptTemplate = p2pkh.unlock(
						payKey,
						'all',
						false,
						satoshis,
						lockingScript
					)
				} else if (lockingHex === ordLockScript) {
					input.unlockingScriptTemplate = p2pkh.unlock(
						ordKey,
						'all',
						false,
						satoshis,
						lockingScript
					)
				}
			}
		}
	}

	// Sign the transaction
	await tx.sign()

	return {
		rawtx: tx.toHex(),
		txid: tx.id('hex'),
	}
}

function SignContent() {
	const searchParams = useSearchParams()
	const { hasWallet, isWalletLocked, walletKeys, unlockWallet } = useWallet()
	const [isSigning, setIsSigning] = useState(false)
	const [passphrase, setPassphrase] = useState('')
	const [unlockError, setUnlockError] = useState<string | null>(null)

	// Parse popup parameters
	const { requestId, origin, appName, params } = parsePopupParams(searchParams)
	const txParams = params as SignTransactionParams | undefined

	// Validate we have required params
	const isValidRequest = requestId && origin && txParams?.rawtx

	// Parse transaction for display
	const getTxSummary = useCallback(() => {
		if (!txParams?.rawtx) return null

		try {
			const tx = Transaction.fromHex(txParams.rawtx)
			const txHex = txParams.rawtx
			return {
				size: Math.floor(txHex.length / 2),
				preview: `${txHex.slice(0, 32)}...${txHex.slice(-32)}`,
				inputs: tx.inputs.length,
				outputs: tx.outputs.length,
			}
		} catch {
			return null
		}
	}, [txParams])

	const txSummary = getTxSummary()

	// Handle signing approval
	const handleApprove = async () => {
		if (!isValidRequest || !walletKeys || !txParams) return

		setIsSigning(true)
		try {
			// Sign the transaction using wallet keys
			const result = await signTransactionWithKeys(
				txParams.rawtx,
				walletKeys.payPk,
				walletKeys.ordPk
			)

			sendResponse(
				requestId,
				{
					rawtx: result.rawtx,
					txid: result.txid,
				},
				origin
			)
		} catch (error) {
			console.error('Failed to sign transaction:', error)
			sendErrorResponse(
				requestId,
				ErrorCodes.INTERNAL_ERROR,
				error instanceof Error ? error.message : 'Failed to sign transaction',
				origin
			)
		} finally {
			setIsSigning(false)
		}
	}

	// Handle rejection
	const handleReject = () => {
		if (!requestId || !origin) return
		rejectRequest(requestId, origin, 'User rejected transaction signing')
	}

	// Handle unlock
	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault()
		setUnlockError(null)

		const success = await unlockWallet(passphrase)
		if (!success) {
			setUnlockError('Invalid passphrase')
		}
		setPassphrase('')
	}

	// No wallet exists
	if (!hasWallet) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-destructive">No Wallet Found</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-muted-foreground">
							You need to create or import a wallet before signing transactions.
						</p>
						<Button
							variant="outline"
							onClick={() => {
								if (requestId && origin) {
									rejectRequest(requestId, origin, 'No wallet exists')
								} else {
									window.close()
								}
							}}
						>
							Close
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Wallet is locked
	if (isWalletLocked) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
						<CardTitle>Unlock Wallet</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleUnlock} className="space-y-4">
							<div>
								<p className="text-sm text-muted-foreground mb-4 text-center">
									Enter your passphrase to sign the transaction
								</p>
								<input
									type="password"
									value={passphrase}
									onChange={(e) => setPassphrase(e.target.value)}
									placeholder="Passphrase"
									className="w-full px-3 py-2 rounded-md border bg-background"
									autoFocus
								/>
								{unlockError && (
									<p className="text-sm text-destructive mt-2">{unlockError}</p>
								)}
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => {
										if (requestId && origin) {
											walletLockedError(requestId, origin)
										} else {
											window.close()
										}
									}}
								>
									Cancel
								</Button>
								<Button type="submit" className="flex-1">
									Unlock
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Invalid request
	if (!isValidRequest) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-destructive">Invalid Request</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-muted-foreground">
							This page was opened without valid transaction parameters.
						</p>
						<Button variant="outline" onClick={() => window.close()}>
							Close
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Sign transaction screen
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<FileText className="h-12 w-12 mx-auto text-primary mb-2" />
					<CardTitle>Sign Transaction</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* App info */}
					<div className="text-center space-y-2">
						<p className="font-medium text-lg">{appName || 'Unknown App'}</p>
						<p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
							<ExternalLink className="h-3 w-3" />
							{origin}
						</p>
					</div>

					{/* Transaction details */}
					<div className="bg-muted/50 rounded-lg p-4 space-y-3">
						{txParams?.description && (
							<div>
								<p className="text-sm font-medium">Description</p>
								<p className="text-sm text-muted-foreground">
									{txParams.description}
								</p>
							</div>
						)}
						{txSummary && (
							<>
								<div>
									<p className="text-sm font-medium">Transaction Size</p>
									<p className="text-sm text-muted-foreground">
										{txSummary.size} bytes
									</p>
								</div>
								<div>
									<p className="text-sm font-medium">Raw Transaction</p>
									<p className="text-xs text-muted-foreground font-mono break-all">
										{txSummary.preview}
									</p>
								</div>
							</>
						)}
					</div>

					{/* Warning */}
					<div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
						<AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
						<p className="text-sm text-yellow-600 dark:text-yellow-400">
							Only sign transactions from apps you trust. Signing a malicious
							transaction could result in loss of funds.
						</p>
					</div>

					{/* Action buttons */}
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleReject}
							disabled={isSigning}
						>
							<X className="h-4 w-4 mr-2" />
							Reject
						</Button>
						<Button
							className="flex-1"
							onClick={handleApprove}
							disabled={isSigning}
						>
							{isSigning ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<CheckCircle className="h-4 w-4 mr-2" />
							)}
							Sign
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function SignPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<SignContent />
		</Suspense>
	)
}
