'use client';
import { useSearchParams } from 'next/navigation';
import { ContinuousIntegrationTable } from '@/components/continuousIntegration';
import { ContinuousDeploymentTable } from '@/components/continuousDeployment';

export default function Page() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceid');
  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* <div> chart</div> */}
      <div>
        <ContinuousIntegrationTable serviceId={Number(serviceId)} />
      </div>
      <div>
        <ContinuousDeploymentTable serviceId={Number(serviceId)} />
      </div>
    </div>
  );
}
