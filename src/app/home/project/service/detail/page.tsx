export default function Page() {
  return (
    <div className='p-6'>
      <div> chart is here</div>
      <div className='flex gap-4'>
        <div className='w-1/2 rounded-lg border border-gray-300 p-4'>
          <div>ci table</div>
        </div>
        <div className='w-1/2 rounded-lg border border-gray-300 p-4'>
          <div>cd table</div>
        </div>
      </div>
    </div>
  );
}
