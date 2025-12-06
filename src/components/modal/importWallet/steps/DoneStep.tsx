import { CheckCircle2, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
	onDone: () => void;
}

export function DoneStep({ onDone }: Props) {
	return (
		<div className="flex flex-col items-center py-6">
			{/* Success Animation */}
			<div className="relative mb-6">
				<div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
					<div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
						<CheckCircle2 className="w-10 h-10 text-primary" />
					</div>
				</div>
				{/* Decorative rings */}
				<div
					className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"
					style={{ animationDuration: "2s" }}
				/>
			</div>

			{/* Success Message */}
			<h3 className="text-lg font-mono uppercase tracking-widest text-foreground mb-2">
				Wallet Imported
			</h3>
			<p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
				Your wallet has been successfully imported and is ready to use.
			</p>

			{/* Feature highlights */}
			<div className="grid grid-cols-2 gap-3 w-full mb-6">
				<div className="flex items-center gap-2 p-3 bg-card border border-border rounded">
					<Wallet className="w-4 h-4 text-primary" />
					<span className="text-xs font-mono text-muted-foreground">
						Keys Restored
					</span>
				</div>
				<div className="flex items-center gap-2 p-3 bg-card border border-border rounded">
					<Shield className="w-4 h-4 text-primary" />
					<span className="text-xs font-mono text-muted-foreground">
						Encrypted
					</span>
				</div>
			</div>

			{/* Action */}
			<Button onClick={onDone} className="w-full">
				Open Wallet
			</Button>
		</div>
	);
}
