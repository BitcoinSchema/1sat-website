"use client";

import type {
	CounterpartyPermissions,
	GroupedPermissions,
	PermissionRequest,
} from "@bsv/wallet-toolbox-client";
import { CheckCircle, ShieldAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	BridgeCounterpartyPermissionRequest,
	BridgeGroupedPermissionRequest,
	BridgePermissionRequest,
} from "@/lib/cwi/bridge";
import {
	counterpartyConsentEntries,
	descriptionConflictsWithAmount,
	groupedConsentEntries,
	isCompressedPublicKey,
	isPermissionRequest,
	parseCounterpartyPermissions,
	parseGroupedPermissions,
	permissionExpiry,
	selectCounterpartyPermissions,
	selectGroupedPermissions,
	spendingRequestAmount,
} from "@/lib/cwi/consent";
import type { CWIIndividualGrant } from "@/lib/cwi/types";
import { useCWIBridge } from "@/lib/hooks/use-cwi-bridge";

function PermissionDetails({
	details: request,
}: {
	details: PermissionRequest;
}) {
	switch (request.type) {
		case "protocol":
			return (
				<div className="space-y-1 text-sm">
					<p className="font-medium">Protocol Access</p>
					{request.protocolID && (
						<p className="text-muted-foreground">
							Protocol: {request.protocolID[1]} (Level {request.protocolID[0]})
						</p>
					)}
					{request.counterparty && (
						<p className="text-muted-foreground truncate">
							Counterparty: {request.counterparty}
						</p>
					)}
					{request.reason && (
						<p className="text-muted-foreground">{request.reason}</p>
					)}
				</div>
			);
		case "basket":
			return (
				<div className="space-y-1 text-sm">
					<p className="font-medium">Basket Access</p>
					{request.basket && (
						<p className="text-muted-foreground">Basket: {request.basket}</p>
					)}
					{request.reason && (
						<p className="text-muted-foreground">{request.reason}</p>
					)}
				</div>
			);
		case "spending": {
			return (
				<div className="space-y-1 text-sm">
					<p className="font-medium">Spending Authorization</p>
					{request.spending && (
						<p className="text-muted-foreground">
							Requested total: {request.spending.satoshis.toLocaleString()}{" "}
							satoshis
						</p>
					)}
					{request.spending?.lineItems?.map((item) => (
						<p
							key={`${item.type}-${item.description}`}
							className="text-muted-foreground text-xs"
						>
							{item.type}: {item.description} ({item.satoshis} sat)
						</p>
					))}
					{request.reason && (
						<p className="text-muted-foreground">{request.reason}</p>
					)}
				</div>
			);
		}
		case "certificate":
			return (
				<div className="space-y-1 text-sm">
					<p className="font-medium">Certificate Access</p>
					{request.certificate && (
						<>
							<p className="text-muted-foreground truncate">
								Type: {request.certificate.certType}
							</p>
							<p className="text-muted-foreground break-all">
								Verifier: {request.certificate.verifier}
							</p>
							<p className="text-muted-foreground">
								Fields: {request.certificate.fields.join(", ")}
							</p>
						</>
					)}
					{request.reason && (
						<p className="text-muted-foreground">{request.reason}</p>
					)}
				</div>
			);
		default:
			return null;
	}
}

function PermissionCard({
	permission,
	queueLength,
	onGrant,
	onDeny,
}: {
	permission: BridgePermissionRequest;
	queueLength: number;
	onGrant: (id: string, grant?: CWIIndividualGrant) => void;
	onDeny: (id: string) => void;
}) {
	const details =
		isPermissionRequest(permission.details) &&
		permission.details.requestID === permission.requestID &&
		permission.details.type === permission.permissionType
			? permission.details
			: null;
	const [duration, setDuration] = useState<"thirty-days" | "until-revoked">(
		"thirty-days",
	);
	const spendingAmount = spendingRequestAmount(details);
	const malformedSpending = details?.type === "spending" && !spendingAmount;
	const suspiciousSpendingDescription =
		details?.type === "spending" &&
		spendingAmount !== null &&
		descriptionConflictsWithAmount(details.reason, spendingAmount);

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center space-y-1">
				<ShieldAlert className="h-10 w-10 mx-auto text-amber-500 mb-2" />
				<CardTitle className="text-lg">Permission Request</CardTitle>
				<CardDescription className="truncate">
					{permission.originator}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="bg-muted/50 rounded-lg p-3">
					{details ? (
						<PermissionDetails details={details} />
					) : (
						<p className="text-sm text-destructive">
							This permission request is malformed and cannot be approved.
						</p>
					)}
				</div>
				{details?.privileged && (
					<Badge variant="destructive" className="w-full justify-center">
						Privileged Operation
					</Badge>
				)}
				{queueLength > 1 && (
					<Badge variant="secondary" className="w-full justify-center">
						{queueLength - 1} more pending request
						{queueLength - 1 !== 1 ? "s" : ""}
					</Badge>
				)}
				{details && details.type !== "spending" && (
					<label className="block text-sm space-y-1">
						<span className="font-medium">Duration</span>
						<select
							className="w-full rounded-md border bg-background px-3 py-2"
							value={duration}
							onChange={(event) =>
								setDuration(
									event.target.value as "thirty-days" | "until-revoked",
								)
							}
						>
							<option value="thirty-days">30 days</option>
							<option value="until-revoked">Until revoked</option>
						</select>
					</label>
				)}
				{malformedSpending && (
					<p className="text-sm text-destructive">
						This spending request has an invalid amount and cannot be approved.
					</p>
				)}
				{suspiciousSpendingDescription && (
					<p className="text-sm text-amber-600">
						Warning: the description contains a satoshi amount that conflicts
						with the structured total above.
					</p>
				)}
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => onDeny(permission.requestID)}
					>
						<X className="h-4 w-4 mr-1" data-icon="inline-start" />
						Deny
					</Button>
					{details?.type === "spending" ? (
						<>
							<Button
								className="flex-1"
								disabled={malformedSpending}
								onClick={() =>
									onGrant(permission.requestID, { ephemeral: true })
								}
							>
								One time
							</Button>
							<Button
								className="flex-1"
								disabled={malformedSpending}
								onClick={() =>
									onGrant(permission.requestID, {
										ephemeral: false,
										amount: spendingAmount ?? undefined,
									})
								}
							>
								Standing monthly
							</Button>
						</>
					) : details ? (
						<Button
							className="flex-1"
							onClick={() =>
								onGrant(permission.requestID, {
									ephemeral: false,
									expiry: permissionExpiry(duration),
								})
							}
						>
							<CheckCircle className="h-4 w-4 mr-1" data-icon="inline-start" />
							Allow
						</Button>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}

function GroupedPermissionCard({
	permission,
	queueLength,
	onGrant,
	onDeny,
}: {
	permission: BridgeGroupedPermissionRequest;
	queueLength: number;
	onGrant: (
		id: string,
		granted: Partial<GroupedPermissions>,
		expiry?: number,
	) => void;
	onDeny: (id: string) => void;
}) {
	const permissions = useMemo(
		() => parseGroupedPermissions(permission.permissions),
		[permission.permissions],
	);
	const entries = useMemo(
		() => (permissions ? groupedConsentEntries(permissions) : []),
		[permissions],
	);
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(entries.map((entry) => entry.id)),
	);
	const [duration, setDuration] = useState<"thirty-days" | "until-revoked">(
		"thirty-days",
	);
	const selectedNonSpending = [...selected].some((id) => id !== "spending");
	const suspiciousSpendingDescription = permissions?.spendingAuthorization
		? descriptionConflictsWithAmount(
				permissions.spendingAuthorization.description,
				permissions.spendingAuthorization.amount,
			)
		: false;

	const toggle = (id: string) => {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center space-y-1">
				<ShieldAlert className="h-10 w-10 mx-auto text-amber-500 mb-2" />
				<CardTitle className="text-lg">App Permissions</CardTitle>
				<CardDescription className="truncate">
					{permission.originator}
				</CardDescription>
				{permissions?.description && (
					<p className="text-sm text-muted-foreground">
						{permissions.description}
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{permissions ? (
					<div className="bg-muted/50 rounded-lg p-3 space-y-2">
						{entries.map((entry) => (
							<label key={entry.id} className="flex items-start gap-2 text-sm">
								<input
									type="checkbox"
									className="mt-1"
									checked={selected.has(entry.id)}
									onChange={() => toggle(entry.id)}
								/>
								<span>
									<span className="font-medium">{entry.label}: </span>
									<span className="text-muted-foreground break-all">
										{entry.detail}
									</span>
									{entry.description && (
										<span className="block text-muted-foreground text-xs">
											{entry.description}
										</span>
									)}
								</span>
							</label>
						))}
					</div>
				) : (
					<p className="text-sm text-destructive">
						This manifest contains malformed or privileged entries and cannot be
						approved.
					</p>
				)}
				{suspiciousSpendingDescription && (
					<p className="text-sm text-amber-600">
						Warning: the spending description conflicts with its structured
						monthly limit.
					</p>
				)}
				{permissions && selectedNonSpending && (
					<label className="block text-sm space-y-1">
						<span className="font-medium">
							Protocol, basket, and certificate duration
						</span>
						<select
							className="w-full rounded-md border bg-background px-3 py-2"
							value={duration}
							onChange={(event) =>
								setDuration(
									event.target.value as "thirty-days" | "until-revoked",
								)
							}
						>
							<option value="thirty-days">30 days</option>
							<option value="until-revoked">Until revoked</option>
						</select>
					</label>
				)}
				{queueLength > 1 && (
					<Badge variant="secondary" className="w-full justify-center">
						{queueLength - 1} more pending request
						{queueLength - 1 !== 1 ? "s" : ""}
					</Badge>
				)}
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => onDeny(permission.requestID)}
					>
						<X className="h-4 w-4 mr-1" data-icon="inline-start" />
						Deny
					</Button>
					<Button
						className="flex-1"
						disabled={!permissions || selected.size === 0}
						onClick={() =>
							permissions &&
							onGrant(
								permission.requestID,
								selectGroupedPermissions(permissions, selected),
								selectedNonSpending ? permissionExpiry(duration) : undefined,
							)
						}
					>
						<CheckCircle className="h-4 w-4 mr-1" data-icon="inline-start" />
						Allow Selected
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function CounterpartyPermissionCard({
	permission,
	queueLength,
	onGrant,
	onDeny,
}: {
	permission: BridgeCounterpartyPermissionRequest;
	queueLength: number;
	onGrant: (
		id: string,
		granted: Partial<CounterpartyPermissions>,
		expiry?: number,
	) => void;
	onDeny: (id: string) => void;
}) {
	const permissions = useMemo(
		() => parseCounterpartyPermissions(permission.permissions),
		[permission.permissions],
	);
	const entries = useMemo(
		() => (permissions ? counterpartyConsentEntries(permissions) : []),
		[permissions],
	);
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(entries.map((entry) => entry.id)),
	);
	const [duration, setDuration] = useState<"thirty-days" | "until-revoked">(
		"thirty-days",
	);
	const validCounterparty = isCompressedPublicKey(permission.counterparty);

	const toggle = (id: string) => {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center space-y-1">
				<ShieldAlert className="h-10 w-10 mx-auto text-amber-500 mb-2" />
				<CardTitle className="text-lg">Counterparty Access</CardTitle>
				<CardDescription className="truncate">
					{permission.originator}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="bg-muted/50 rounded-lg p-3 space-y-2">
					<div className="text-sm">
						<span className="font-medium">Counterparty: </span>
						<span className="text-muted-foreground break-all">
							{permission.counterparty}
						</span>
					</div>
					{entries.map((entry) => (
						<label key={entry.id} className="flex items-start gap-2 text-sm">
							<input
								type="checkbox"
								className="mt-1"
								checked={selected.has(entry.id)}
								onChange={() => toggle(entry.id)}
							/>
							<span>
								<span className="font-medium">{entry.label}: </span>
								<span className="text-muted-foreground break-all">
									{entry.detail}
								</span>
								{entry.description && (
									<span className="block text-muted-foreground text-xs">
										{entry.description}
									</span>
								)}
							</span>
						</label>
					))}
				</div>
				{(!permissions || !validCounterparty) && (
					<p className="text-sm text-destructive">
						This PACT request is malformed or is not exclusively Level 2, so it
						cannot be approved.
					</p>
				)}
				{permissions && validCounterparty && (
					<label className="block text-sm space-y-1">
						<span className="font-medium">Trust duration</span>
						<select
							className="w-full rounded-md border bg-background px-3 py-2"
							value={duration}
							onChange={(event) =>
								setDuration(
									event.target.value as "thirty-days" | "until-revoked",
								)
							}
						>
							<option value="thirty-days">30 days</option>
							<option value="until-revoked">Until revoked</option>
						</select>
					</label>
				)}
				{queueLength > 1 && (
					<Badge variant="secondary" className="w-full justify-center">
						{queueLength - 1} more pending request
						{queueLength - 1 !== 1 ? "s" : ""}
					</Badge>
				)}
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => onDeny(permission.requestID)}
					>
						<X className="h-4 w-4 mr-1" data-icon="inline-start" />
						Deny
					</Button>
					<Button
						className="flex-1"
						disabled={!permissions || !validCounterparty || selected.size === 0}
						onClick={() =>
							permissions &&
							onGrant(
								permission.requestID,
								selectCounterpartyPermissions(permissions, selected),
								permissionExpiry(duration),
							)
						}
					>
						<CheckCircle className="h-4 w-4 mr-1" data-icon="inline-start" />
						Trust Selected
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export default function CWIPage() {
	const {
		status,
		activePermission,
		activeGroupedPermission,
		activeCounterpartyPermission,
		queueLength,
		transport,
		fallbackRecommended,
		reason,
		storageAccessRequired,
		grantPermission,
		denyPermission,
		grantGroupedPermission,
		denyGroupedPermission,
		grantCounterpartyPermission,
		denyCounterpartyPermission,
		grantStorageAccess,
	} = useCWIBridge();

	const showOverlay =
		!!activePermission ||
		!!activeGroupedPermission ||
		!!activeCounterpartyPermission ||
		storageAccessRequired;

	// Notify parent frame about CWI state so it can resize the iframe.
	useEffect(() => {
		if (!window.parent || window.parent === window) return;
		window.parent.postMessage(
			{
				type: "CWI",
				cwiState: {
					status,
					hasPermission: showOverlay,
					transport,
					fallbackRecommended,
					reason,
				},
			},
			"*",
		);
	}, [status, showOverlay, transport, fallbackRecommended, reason]);

	if (storageAccessRequired) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center space-y-1">
						<CardTitle className="text-lg">Connect Wallet</CardTitle>
						<CardDescription>
							Click below to allow wallet communication
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className="w-full" onClick={grantStorageAccess}>
							<CheckCircle className="h-4 w-4 mr-1" data-icon="inline-start" />
							Allow Connection
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Grouped permission — single prompt for all app permissions from manifest
	if (activeGroupedPermission) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<GroupedPermissionCard
					key={activeGroupedPermission.requestID}
					permission={activeGroupedPermission}
					queueLength={queueLength}
					onGrant={grantGroupedPermission}
					onDeny={denyGroupedPermission}
				/>
			</div>
		);
	}

	// Counterparty permission — pact with a specific counterparty key
	if (activeCounterpartyPermission) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<CounterpartyPermissionCard
					key={activeCounterpartyPermission.requestID}
					permission={activeCounterpartyPermission}
					queueLength={queueLength}
					onGrant={grantCounterpartyPermission}
					onDeny={denyCounterpartyPermission}
				/>
			</div>
		);
	}

	// Individual permission request
	if (activePermission) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<PermissionCard
					key={activePermission.requestID}
					permission={activePermission}
					queueLength={queueLength}
					onGrant={grantPermission}
					onDeny={denyPermission}
				/>
			</div>
		);
	}

	// All other states: transparent so the iframe is invisible over the host
	// dApp. The bridge still relays postMessage regardless of UI state.
	return <div className="min-h-screen" />;
}
