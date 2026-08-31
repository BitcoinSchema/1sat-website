import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { CertificateCenter } from "@/components/wallet/certificate-center";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletCertificatesPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Certificates</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-6">
						<CertificateCenter />
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
