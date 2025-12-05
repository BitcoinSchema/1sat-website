import type React from "react";
import { Suspense } from "react";
import FlowLoader from "./flowLoader";
import HomeLoadingSkeleton from "./loadingSkeleton";

const HomePage: React.FC = async () => {
	return (
		<div className="h-full w-full overflow-y-auto">
			<div className="px-4 py-6 w-full">
				<Suspense fallback={<HomeLoadingSkeleton />}>
					<FlowLoader />
				</Suspense>
			</div>
		</div>
	);
};

export default HomePage;
