const HomeLoadingSkeleton = () => {
    return (
        <div className="relative text-center rounded-lg shadow-2xl min-h-[calc(100dvh-15rem)] mx-auto px-4 max-w-[100rem] w-full">
            <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4'>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="relative mb-4 break-inside-avoid">
                        <div className="skeleton w-full aspect-square rounded-lg bg-[#333] animate-pulse"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeLoadingSkeleton;
