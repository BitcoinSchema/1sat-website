"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ListingsTabs() {
	return (
		<Tabs defaultValue="ordinals" className="w-full">
			<TabsList>
				<TabsTrigger value="ordinals">Ordinals</TabsTrigger>
				<TabsTrigger value="tokens">Tokens</TabsTrigger>
			</TabsList>

			<TabsContent value="ordinals" className="mt-4">
				<Card>
					<CardHeader>
						<CardTitle>Active Ordinal Listings</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-muted-foreground">
							No active ordinal listings found.
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="tokens" className="mt-4">
				<Card>
					<CardHeader>
						<CardTitle>Active Token Listings</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-muted-foreground">
							No active token listings found.
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
