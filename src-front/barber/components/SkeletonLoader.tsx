import React from 'react';

const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => {
    return <div className={`bg-gray-200 rounded-lg shimmer ${className}`} />;
};

export const HomeScreenSkeleton: React.FC = () => (
    <div className="p-4">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <SkeletonLoader className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                    <SkeletonLoader className="h-4 w-28" />
                    <SkeletonLoader className="h-5 w-36" />
                </div>
            </div>
            <SkeletonLoader className="w-10 h-10 rounded-full" />
        </div>
        
        <SkeletonLoader className="h-10 w-full rounded-lg mb-6" />

        <div className="grid grid-cols-2 gap-4 mb-6">
            <SkeletonLoader className="h-32 rounded-lg" />
            <SkeletonLoader className="h-32 rounded-lg" />
            <div className="col-span-2">
                <SkeletonLoader className="h-40 rounded-lg" />
            </div>
        </div>

        <div>
            <div className="flex justify-between items-center mb-4">
              <SkeletonLoader className="h-6 w-48 rounded-md" />
              <SkeletonLoader className="h-4 w-20 rounded-md" />
            </div>
            <div className="space-y-3">
                <SkeletonLoader className="h-36 rounded-lg" />
                <SkeletonLoader className="h-36 rounded-lg" />
            </div>
        </div>
    </div>
);

export default SkeletonLoader;

