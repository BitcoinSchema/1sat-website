import { cn } from "@/lib/utils";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Page({ children, className, ...props }: PageProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-6 p-4 max-w-6xl mx-auto w-full",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function PageHeader({ children, className, ...props }: PageProps) {
	return (
		<div
			className={cn("flex items-center justify-between", className)}
			{...props}
		>
			{children}
		</div>
	);
}

export function PageTitle({
	children,
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h1
			className={cn("text-2xl font-bold tracking-tight", className)}
			{...props}
		>
			{children}
		</h1>
	);
}

export function PageContent({ children, className, ...props }: PageProps) {
	return (
		<div className={cn("w-full", className)} {...props}>
			{children}
		</div>
	);
}
