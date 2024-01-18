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
            <Suspense fallback={<div className="w-96 h-96 flex items-center justify-center"><LoaderIcon /></div>}>
              <SlideshowLoader />
            </Suspense>
            <Link
              href="/listings"
              className="btn btn-lg btn-primary  font-bold mt-4"
            >
              Start Collecting
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
