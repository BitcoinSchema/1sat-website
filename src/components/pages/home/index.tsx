import type { OrdUtxo } from "@/types/ordinals";
import type React from "react";
import { Suspense } from "react";
import { LoaderIcon } from "react-hot-toast";
import SlideshowLoader from "./loader";
import FlowLoader from "./flowLoader";
import HomeLoadingSkeleton from "./loadingSkeleton";

const HomePage: React.FC = async () => {
  return (
    <main className="px-4 flex items-center justify-center w-full min-h-[calc(100dvh-15rem+)]">
      <div className="flex flex-col items-center w-full h-full">
        <Suspense fallback={<HomeLoadingSkeleton />}>
          <FlowLoader />
        </Suspense>
      </div>
    </main>
  );
};

export default HomePage;
