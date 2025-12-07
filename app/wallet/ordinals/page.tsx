import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/components/page-layout";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import WalletFlowGrid from "@/components/wallet/wallet-flow-grid";

export default function WalletOrdinalsPage() {
  return (
    <Page>
      <PageHeader>
        <PageTitle>Wallet</PageTitle>
      </PageHeader>
      <PageContent>
        <WalletTabs>
          <div className="mt-4">
            <WalletFlowGrid />
          </div>
        </WalletTabs>
      </PageContent>
    </Page>
  );
}
