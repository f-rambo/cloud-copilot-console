'use client';

import { ClusterDetails } from '@/components/cluster-detail';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ClusterDetailContent() {
  const searchParams = useSearchParams();
  const clusterId = searchParams.get('clusterid');

  return (
    <div className='p-6'>
      <ClusterDetails clusterId={clusterId || ''} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClusterDetailContent />
    </Suspense>
  );
}
