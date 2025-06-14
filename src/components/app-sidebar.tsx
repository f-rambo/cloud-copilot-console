'use client';

import * as React from 'react';
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Users,
  Cloudy,
  Building2,
  Clapperboard
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';

const data = {
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise'
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup'
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free'
    }
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/home/dashboard',
      icon: LayoutDashboard,
      isActive: true
    },
    {
      title: 'Workspace',
      url: '/home/workspace',
      icon: Building2,
      items: [
        {
          title: 'Roles',
          url: '#'
        }
      ]
    },
    {
      title: 'Cluster',
      url: '/home/cluster',
      icon: Cloudy
    },
    {
      title: 'Project',
      url: '/home/project',
      icon: Clapperboard,
      items: [
        {
          title: 'Apps',
          url: '/home/project/app'
        },
        {
          title: 'Services',
          url: '/home/project/service'
        }
      ]
    },
    {
      title: 'User',
      url: '/home/user',
      icon: Users
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
