import Link from "next/link";
import React, { Suspense } from "react";
import { LoaderIcon } from "react-hot-toast";
import SlideshowLoader from "./loader";

export interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = async () => {
  // every 30 seconds rotate the top artifact to the bottom
  return (
    <>
      <main className="px-4 flex items-center justify-center h-full w-full min-h-[calc(100dvh-15rem+)]">
        <div className="flex flex-col items-center w-full h-full">
          <div className="w-full flex flex-col items-center justify-center h-full">
            <Suspense
              fallback={
                <div className="w-96 h-fit flex items-center justify-center">
                  <LoaderIcon />
                </div>
              }
            >
              <SlideshowLoader />
            </Suspense>
            <div className="divider divider-warning w-64 mx-auto text-warning/50">
              BROWSE DEX
            </div>
            <div className="flex mx-auto max-w-fit gap-4">
              <Link
                href="/market/ordinals"
                className="flex flex-col btn btn-lg btn-primary  font-bold mt-4"
              >
                Ordinals
                <span className="font-normal text-xs text-neutral/50">Art</span>
              </Link>
              <Link
                href="/market/bsv20"
                className="flex flex-col btn btn-lg btn-primary  font-bold mt-4"
              >
                BSV20
                <span className="font-normal text-xs text-neutral/50">Degen</span>
              </Link>
              <Link
                href="/market/bsv21"
                className="flex flex-col btn btn-lg btn-primary  font-bold mt-4"
              >
                BSV21
                <span className="font-normal text-xs text-neutral/50">Pro</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
