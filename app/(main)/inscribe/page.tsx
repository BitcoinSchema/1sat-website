import { InscriptionStudio } from "@/components/inscriptions/inscription-studio";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";

export default function InscribePage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Inscribe and mint</PageTitle>
			</PageHeader>
			<PageContent>
				<InscriptionStudio />
			</PageContent>
		</Page>
	);
}
