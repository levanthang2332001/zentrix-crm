import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, roles, and user tier.
 *
 * Examples:
 *
 * 1. Require specific permission:
 *    access: { permission: 'f1:set_rate_f2' }
 *
 * 2. Require specific role (tier):
 *    access: { role: 'F0' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Hoàn Phí',
        url: '#',
        icon: 'refresh',
        isActive: true,
        items: [
          {
            title: 'Danh Sách',
            url: '/dashboard/rebate/list',
            icon: 'layoutGrid'
          },
          // {
          //   title: 'Lịch Sử',
          //   url: '/dashboard/rebate/history',
          //   icon: 'history'
          // },
          {
            title: 'Rút Tiền',
            url: '/dashboard/rebate/withdraw',
            icon: 'download'
          }
        ]
      }
      // {
      //   title: 'Reward Hub',
      //   url: '#',
      //   icon: 'gift',
      //   isActive: true,
      //   items: [
      //     {
      //       title: 'Nhiệm Vụ',
      //       url: '/dashboard/rewards/tasks',
      //       icon: 'tasks'
      //     },
      //     {
      //       title: 'Đổi Thưởng',
      //       url: '/dashboard/rewards/redeem',
      //       icon: 'sparkles'
      //     }
      //   ]
      // }

      // {
      //   title: 'Users',
      //   url: '/dashboard/users',
      //   icon: 'teams',
      //   shortcut: ['u', 'u'],
      //   isActive: false,
      //   items: []
      // },
      // {
      //   title: 'Kanban',
      //   url: '/dashboard/kanban',
      //   icon: 'kanban',
      //   shortcut: ['k', 'k'],
      //   isActive: false,
      //   items: []
      // },
      // {
      //   title: 'Chat',
      //   url: '/dashboard/chat',
      //   icon: 'chat',
      //   shortcut: ['c', 'c'],
      //   isActive: false,
      //   items: []
      // },
    ]
  }
  // {
  //   label: 'Elements',
  //   items: [
  //     {
  //       title: 'Forms',
  //       url: '#',
  //       icon: 'forms',
  //       isActive: true,
  //       items: [
  //         {
  //           title: 'Basic Form',
  //           url: '/dashboard/forms/basic',
  //           icon: 'forms',
  //           shortcut: ['f', 'f']
  //         },
  //         {
  //           title: 'Multi-Step Form',
  //           url: '/dashboard/forms/multi-step',
  //           icon: 'forms'
  //         },
  //         {
  //           title: 'Sheet & Dialog',
  //           url: '/dashboard/forms/sheet-form',
  //           icon: 'forms'
  //         },
  //         {
  //           title: 'Advanced Patterns',
  //           url: '/dashboard/forms/advanced',
  //           icon: 'forms'
  //         }
  //       ]
  //     },
  //     {
  //       title: 'React Query',
  //       url: '/dashboard/react-query',
  //       icon: 'code',
  //       isActive: false,
  //       items: []
  //     },
  //     {
  //       title: 'Icons',
  //       url: '/dashboard/elements/icons',
  //       icon: 'palette',
  //       isActive: false,
  //       items: []
  //     }
  //   ]
  // },
  // {
  //   label: 'Cài đặt',
  //   items: [
  //     {
  //       title: 'Cài đặt',
  //       url: '/dashboard/settings',
  //       icon: 'settings',
  //       shortcut: ['s', 's']
  //     }
  //   ]
  // },
  // {
  //   label: 'Tài nguyên',
  //   items: [
  //     {
  //       title: 'Blog',
  //       url: '/dashboard/resources/blog',
  //       icon: 'post'
  //     },
  //     {
  //       title: 'Tài liệu',
  //       url: '/dashboard/resources/docs',
  //       icon: 'book'
  //     }
  //   ]
  // }
];
