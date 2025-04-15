import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { CardsChat } from './chat';
import { Notifications } from './notifications';
import { BreadcrumbNav } from './breadcrumb';

export default function Header() {
  return (
    <header className='bg-background sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4'
        />
        <BreadcrumbNav />
      </div>
      <div className='flex items-center gap-2 px-4'>
        <Notifications />
        <CardsChat />
        <ModeToggle />
      </div>
    </header>
  );
}
