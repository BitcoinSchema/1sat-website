"use client";

import { CheckCircle, ShieldAlert, X } from "lucide-react";
import { useEffect } from "react";
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
import { useCWIBridge } from "@/lib/hooks/use-cwi-bridge";

function PermissionDetails({ details }: { details: unknown }) {
	const request = details as {
		type?: string;
		protocolID?: [number, string];
		counterparty?: string;
		basket?: string;
		spending?: {
			satoshis: number;
			lineItems?: Array<{
				type: string;
				description: string;
				satoshis: number;
			}>;
		};
		certificate?: { certType: string; fields: string[] };
		reason?: string;
		privileged?: boolean;
	};

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
		case "spending":
			return (
				<div className="space-y-1 text-sm">
					<p className="font-medium">Spending Authorization</p>
					{request.spending && (
						<p className="text-muted-foreground">
							Amount: {request.spending.satoshis.toLocaleString()} satoshis
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
		case "certificate":
			return (
				<div className="space-y-1 text-sm">
					<p className="font-medium">Certificate Access</p>
					{request.certificate && (
						<>
							<p className="text-muted-foreground truncate">
								Type: {request.certificate.certType}
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
	onGrant: (id: string) => void;
	onDeny: (id: string) => void;
}) {
	const details = permission.details as { privileged?: boolean };

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
					<PermissionDetails details={permission.details} />
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
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => onDeny(permission.requestID)}
					>
						<X className="h-4 w-4 mr-1" />
						Deny
					</Button>
					<Button
						className="flex-1"
						onClick={() => onGrant(permission.requestID)}
					>
						<CheckCircle className="h-4 w-4 mr-1" />
						Allow
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

interface GroupedPermissionEntry {
	protocolID?: [number, string];
	counterparty?: string;
	basket?: string;
	certType?: string;
	fields?: string[];
	satoshis?: number;
}

function GroupedPermissionCard({
	permission,
	queueLength,
	onGrant,
	onDeny,
}: {
	permission: BridgeGroupedPermissionRequest;
	queueLength: number;
	onGrant: (id: string, granted: unknown) => void;
	onDeny: (id: string) => void;
}) {
	const perms = permission.permissions as {
		description?: string;
		protocolPermissions?: GroupedPermissionEntry[];
		basketAccess?: GroupedPermissionEntry[];
		certificateAccess?: GroupedPermissionEntry[];
		spendingAuthorization?: GroupedPermissionEntry[];
	};

	const entries: Array<{ label: string; detail: string }> = [];

	for (const p of perms.protocolPermissions ?? []) {
		if (p.protocolID) {
			entries.push({
				label: "Protocol",
				detail: `${p.protocolID[1]} (Level ${p.protocolID[0]})${p.counterparty ? ` — ${p.counterparty}` : ""}`,
			});
		}
	}
	for (const b of perms.basketAccess ?? []) {
		if (b.basket) {
			entries.push({ label: "Basket", detail: b.basket });
		}
	}
	for (const c of perms.certificateAccess ?? []) {
		if (c.certType) {
			entries.push({
				label: "Certificate",
				detail: `${c.certType}${c.fields?.length ? ` (${c.fields.join(", ")})` : ""}`,
			});
		}
	}
	for (const s of perms.spendingAuthorization ?? []) {
		if (s.satoshis != null) {
			entries.push({
				label: "Spending",
				detail: `${s.satoshis.toLocaleString()} satoshis`,
			});
		}
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center space-y-1">
				<ShieldAlert className="h-10 w-10 mx-auto text-amber-500 mb-2" />
				<CardTitle className="text-lg">App Permissions</CardTitle>
				<CardDescription className="truncate">
					{permission.originator}
				</CardDescription>
				{perms.description && (
					<p className="text-sm text-muted-foreground">
						{perms.description}
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{entries.length > 0 && (
					<div className="bg-muted/50 rounded-lg p-3 space-y-2">
						{entries.map((entry) => (
							<div
								key={`${entry.label}-${entry.detail}`}
								className="text-sm"
							>
								<span className="font-medium">{entry.label}: </span>
								<span className="text-muted-foreground break-all">
									{entry.detail}
								</span>
							</div>
						))}
					</div>
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
						<X className="h-4 w-4 mr-1" />
						Deny
					</Button>
					<Button
						className="flex-1"
						onClick={() =>
							onGrant(permission.requestID, permission.permissions)
						}
					>
						<CheckCircle className="h-4 w-4 mr-1" />
						Allow All
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
	onGrant: (id: string, granted: unknown) => void;
	onDeny: (id: string) => void;
}) {
	const perms = permission.permissions as {
		protocols?: Array<{ protocolID?: [number, string] }>;
		certificates?: Array<{ certType?: string; fields?: string[] }>;
	};

	const entries: Array<{ label: string; detail: string }> = [];

	for (const p of perms.protocols ?? []) {
		if (p.protocolID) {
			entries.push({
				label: "Protocol",
				detail: `${p.protocolID[1]} (Level ${p.protocolID[0]})`,
			});
		}
	}
	for (const c of perms.certificates ?? []) {
		if (c.certType) {
			entries.push({
				label: "Certificate",
				detail: `${c.certType}${c.fields?.length ? ` (${c.fields.join(", ")})` : ""}`,
			});
		}
	}

	const shortKey = `${permission.counterparty.slice(0, 8)}…${permission.counterparty.slice(-8)}`;

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
						<span
							className="text-muted-foreground break-all"
							title={permission.counterparty}
						>
							{shortKey}
						</span>
					</div>
					{entries.map((entry) => (
						<div
							key={`${entry.label}-${entry.detail}`}
							className="text-sm"
						>
							<span className="font-medium">{entry.label}: </span>
							<span className="text-muted-foreground break-all">
								{entry.detail}
							</span>
						</div>
					))}
				</div>
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
						<X className="h-4 w-4 mr-1" />
						Deny
					</Button>
					<Button
						className="flex-1"
						onClick={() =>
							onGrant(permission.requestID, permission.permissions)
						}
					>
						<CheckCircle className="h-4 w-4 mr-1" />
						Allow
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
							<CheckCircle className="h-4 w-4 mr-1" />
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
