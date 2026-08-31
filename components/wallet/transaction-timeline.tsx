"use client";

/**
 * Transaction Timeline Chart
 *
 * Displays wallet transactions over time using data from wallet-toolbox's IndexedDB.
 * Uses Recharts with theme-aware colors.
 */

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface TimelineDataPoint {
	date: string;
	timestamp: number;
	incoming: number;
	outgoing: number;
	balance: number;
	txCount: number;
}

interface TransactionTimelineProps {
	className?: string;
	showBalance?: boolean;
	days?: number;
}

const chartConfig = {
	incoming: {
		label: "Incoming",
		color: "hsl(var(--chart-2))",
	},
	outgoing: {
		label: "Outgoing",
		color: "hsl(var(--chart-1))",
	},
	balance: {
		label: "Balance",
		color: "hsl(var(--chart-3))",
	},
} satisfies ChartConfig;

export function TransactionTimeline({
	className,
	showBalance = false,
	days = 30,
}: TransactionTimelineProps) {
	const { wallet, isInitialized } = useWalletToolbox();
	const [data, setData] = useState<TimelineDataPoint[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadTransactions = useCallback(async () => {
		if (!wallet || !isInitialized) return;

		setIsLoading(true);
		setError(null);

		try {
			// Get transaction history from wallet storage
			const result = await wallet.listActions({
				labels: [],
				labelQueryMode: "any",
				includeLabels: true,
				includeInputs: true,
				includeOutputs: true,
				limit: 1000,
			});

			if (!result.actions || result.actions.length === 0) {
				setData([]);
				return;
			}

			// Group transactions by day
			// Since WalletAction doesn't have timestamps, we'll use today's date
			// and work backwards assuming roughly even distribution
			const now = new Date();
			const dailyData = new Map<string, TimelineDataPoint>();
			let runningBalance = 0;

			// Process actions - assume they're in reverse chronological order
			// and distribute them across the time range
			const actionsPerDay = Math.max(
				1,
				Math.ceil(result.actions.length / days),
			);

			for (let i = result.actions.length - 1; i >= 0; i--) {
				const action = result.actions[i];

				// Calculate approximate date based on position
				const daysAgo = Math.floor(
					(result.actions.length - 1 - i) / actionsPerDay,
				);
				const date = new Date(now);
				date.setDate(date.getDate() - daysAgo);
				const dateKey = date.toISOString().split("T")[0];

				if (!dailyData.has(dateKey)) {
					dailyData.set(dateKey, {
						date: dateKey,
						timestamp: date.getTime(),
						incoming: 0,
						outgoing: 0,
						balance: runningBalance,
						txCount: 0,
					});
				}

				const dayData = dailyData.get(dateKey);
				if (!dayData) continue;
				dayData.txCount++;

				// Calculate incoming/outgoing based on isOutgoing flag
				const satoshis = action.satoshis || 0;
				if (action.isOutgoing) {
					dayData.outgoing += satoshis;
					runningBalance -= satoshis;
				} else {
					dayData.incoming += satoshis;
					runningBalance += satoshis;
				}
				dayData.balance = runningBalance;
			}

			// Convert to array and sort by date
			const chartData = Array.from(dailyData.values()).sort(
				(a, b) => a.timestamp - b.timestamp,
			);

			setData(chartData);
		} catch {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.history.timeline",
				recoverable: true,
				context: { retryable: true },
			});
			setError("Failed to load transaction history. Try again.");
		} finally {
			setIsLoading(false);
		}
	}, [wallet, isInitialized, days]);

	useEffect(() => {
		loadTransactions();
	}, [loadTransactions]);

	if (!isInitialized) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Transaction Timeline
					</CardTitle>
				</CardHeader>
				<CardContent className="h-[200px] flex items-center justify-center">
					<p className="text-sm text-muted-foreground">
						Wallet not initialized
					</p>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Transaction Timeline
					</CardTitle>
				</CardHeader>
				<CardContent className="h-[200px] flex items-center justify-center">
					<Spinner className="size-6 text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Transaction Timeline
					</CardTitle>
				</CardHeader>
				<CardContent className="h-[200px] flex items-center justify-center">
					<p className="text-sm text-destructive">{error}</p>
				</CardContent>
			</Card>
		);
	}

	if (data.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Transaction Timeline
					</CardTitle>
				</CardHeader>
				<CardContent className="h-[200px] flex items-center justify-center">
					<p className="text-sm text-muted-foreground">No transactions yet</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-sm font-medium">
					Transaction Timeline ({days} days)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[200px] w-full">
					<AreaChart
						data={data}
						margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
					>
						<defs>
							<linearGradient id="fillIncoming" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-incoming)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-incoming)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient id="fillOutgoing" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-outgoing)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-outgoing)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							{showBalance && (
								<linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-balance)"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-balance)"
										stopOpacity={0.1}
									/>
								</linearGradient>
							)}
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							className="stroke-muted"
							vertical={false}
						/>
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
							className="text-muted-foreground text-xs"
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => {
								if (value >= 100000000) {
									return `${(value / 100000000).toFixed(1)} BSV`;
								}
								if (value >= 1000000) {
									return `${(value / 1000000).toFixed(1)}M`;
								}
								if (value >= 1000) {
									return `${(value / 1000).toFixed(1)}k`;
								}
								return value.toString();
							}}
							className="text-muted-foreground text-xs"
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(value) => {
										return new Date(String(value)).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										});
									}}
									formatter={(value, name) => {
										const sats = Number(value);
										if (sats >= 100000000) {
											return [`${(sats / 100000000).toFixed(4)} BSV`, name];
										}
										return [`${sats.toLocaleString()} sats`, name];
									}}
								/>
							}
						/>
						<Area
							dataKey="incoming"
							type="monotone"
							fill="url(#fillIncoming)"
							stroke="var(--color-incoming)"
							strokeWidth={2}
							stackId="1"
						/>
						<Area
							dataKey="outgoing"
							type="monotone"
							fill="url(#fillOutgoing)"
							stroke="var(--color-outgoing)"
							strokeWidth={2}
							stackId="2"
						/>
						{showBalance && (
							<Area
								dataKey="balance"
								type="monotone"
								fill="url(#fillBalance)"
								stroke="var(--color-balance)"
								strokeWidth={2}
							/>
						)}
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
