import Link from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";

interface Props {
	currentTab: InscriptionTab | undefined;
	showIndicator?: boolean;
	onClickSelected?: (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
	) => void;
}

export enum InscriptionTab {
	Image = "image",
	BSV20 = "bsv20",
	BSV21 = "bsv21",
	SNS = "sns",
	Text = "text",
	HTML = "html",
	Video = "video",
	Model = "model",
	Collection = "collection",
}

const tabStyles = "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-b-2 border-transparent hover:text-foreground hover:border-muted-foreground/50";
const activeTabStyles = "border-primary text-foreground";
const inactiveTabStyles = "text-muted-foreground";

const InscriptionTabs: React.FC<Props> = ({
	currentTab,
	showIndicator,
	onClickSelected,
}) => {
	return (
		<div role="tablist" className="inline-flex h-9 items-center justify-center gap-1 max-w-7xl mx-auto my-8 border-b border-border">
			<Link
				href={`/inscribe`}
				role={"tab"}
				className={cn(tabStyles, currentTab === InscriptionTab.Image ? activeTabStyles : inactiveTabStyles)}
			>
				<div
					onClick={(e: any) =>
						currentTab === InscriptionTab.Image && onClickSelected
							? onClickSelected(e)
							: () => {}
					}
				>
					Image
				</div>
			</Link>
			<Link
				href={`/inscribe?tab=text`}
				role={"tab"}
				className={cn(tabStyles, currentTab === InscriptionTab.Text ? activeTabStyles : inactiveTabStyles)}
			>
				<div
					onClick={(e: any) =>
						currentTab === InscriptionTab.Text && onClickSelected
							? onClickSelected(e)
							: () => {}
					}
				>
					Text
				</div>
			</Link>
			<Link
				href={`/inscribe?tab=html`}
				role={"tab"}
				className={cn(tabStyles, currentTab === InscriptionTab.HTML ? activeTabStyles : inactiveTabStyles)}
			>
				<div
					onClick={(e: any) =>
						currentTab === InscriptionTab.HTML && onClickSelected
							? onClickSelected(e)
							: () => {}
					}
				>
					HTML
				</div>
			</Link>
			<Link
				href={`/inscribe?tab=bsv20`}
				role={"tab"}
				className={cn(tabStyles, currentTab === InscriptionTab.BSV20 ? activeTabStyles : inactiveTabStyles)}
			>
				<div
					onClick={(e: any) =>
						currentTab === InscriptionTab.BSV20 && onClickSelected
							? onClickSelected(e)
							: () => {}
					}
				>
					BSV-20
				</div>
			</Link>
			<Link
				href={`/inscribe?tab=bsv21`}
				role={"tab"}
				className={cn(tabStyles, currentTab === InscriptionTab.BSV21 ? activeTabStyles : inactiveTabStyles)}
			>
				<div
					onClick={(e: any) =>
						currentTab === InscriptionTab.BSV21 && onClickSelected
							? onClickSelected(e)
							: () => {}
					}
				>
					BSV-21
				</div>
			</Link>
			{/* <div
        $partiallyactive={currentTab === InscriptionTab.Model ? "true" : "false"}
        href={`/inscribe?tab=model`}
        onClick={(e) =>
          currentTab === InscriptionTab.Model && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        3D Model
      </div> */}
			{/* <div
        $partiallyactive={
          currentTab === InscriptionTab.Collection ? "true" : "false"
        }
        href={`/inscribe?tab=collection`}
        onClick={(e) =>
          currentTab === InscriptionTab.Collection && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Collection
      </div> */}
			{/* <div
        $partiallyactive={currentTab === InscriptionTab.BSV20 ? "true" : "false"}
        href={`/inscribe?tab=video`}
        onClick={(e) =>
          currentTab === InscriptionTab.Video && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Video
      </div> */}
		</div>
	);
};

export default InscriptionTabs;
