import PreviewPage from "@/components/pages/preview";

const Preview = () => {
	return <PreviewPage />;
};

export default Preview;

export async function generateMetadata() {
	return {
		title: "Inscription Preview - 1SatOrdinals",
		description: "Preview your inscription before finalizing on 1SatOrdinals.",
		openGraph: {
			title: "Inscription Preview - 1SatOrdinals",
			description:
				"Preview your inscription before finalizing on 1SatOrdinals.",
			type: "website",
		},
		twitter: {
			card: "summary",
			title: "Inscription Preview - 1SatOrdinals",
			description:
				"Preview your inscription before finalizing on 1SatOrdinals.",
		},
	};
}
