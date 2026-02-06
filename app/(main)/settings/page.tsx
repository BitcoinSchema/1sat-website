import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Settings</PageTitle>
			</PageHeader>
			<PageContent>
				<SettingsForm />
			</PageContent>
		</Page>
	);
}
