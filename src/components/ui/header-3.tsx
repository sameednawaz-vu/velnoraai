/** @jsxImportSource react */
'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  CodeIcon,
  FileText,
  GlobeIcon,
  Handshake,
  HelpCircle,
  LayersIcon,
  Leaf,
  PlugIcon,
  RotateCcw,
  Shield,
  Star,
  UserPlusIcon,
  Users,
  BarChart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from './button';
import { cn } from '../../lib/utils';
import { MenuToggleIcon } from './menu-toggle-icon';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu';

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export function Header3() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg': scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <a href="/" className="hover:bg-accent rounded-md p-2">
            <WordmarkIcon className="h-4" />
          </a>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Tools</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5">
                  <ul className="bg-popover grid w-[56rem] grid-cols-3 gap-2 rounded-md border p-2 shadow">
                    {productLinks.map((item, i) => (
                      <li key={i}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Resources</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5 pb-1.5">
                  <div className="grid w-[42rem] grid-cols-2 gap-2">
                    <ul className="bg-popover space-y-2 rounded-md border p-2 shadow">
                      {companyLinks.map((item, i) => (
                        <li key={i}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2 p-3">
                      {companyLinks2.map((item, i) => (
                        <li key={i}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex p-2 hover:bg-accent flex-row rounded-md items-center gap-x-2"
                          >
                            <item.icon className="text-foreground size-4" />
                            <span className="font-medium">{item.title}</span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuLink className="px-4" asChild>
                <a href="/pricing" className="hover:bg-accent rounded-md p-2">
                  Pricing
                </a>
              </NavigationMenuLink>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" asChild>
            <a href="/login">Log In</a>
          </Button>
          <Button asChild>
            <a href="/signup">Sign Up</a>
          </Button>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <NavigationMenu className="max-w-full">
          <div className="flex w-full flex-col gap-y-2">
            <span className="text-sm">Tools</span>
            {productLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            <span className="text-sm">Resources</span>
            {companyLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            {companyLinks2.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
          </div>
        </NavigationMenu>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <a href="/login">Log In</a>
          </Button>
          <Button className="w-full" asChild>
            <a href="/signup">Sign Up</a>
          </Button>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg',
        'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden',
      )}
    >
      <div
        data-slot={open ? 'open' : 'closed'}
        className={cn('data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out', 'size-full p-4', className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn(
        'w-full flex flex-row gap-x-2 data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm p-2',
        className,
      )}
      {...props}
      asChild
    >
      <a href={href}>
        <div className="bg-background/40 flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm">
          <Icon className="text-foreground size-5" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground text-xs">{description}</span>
        </div>
      </a>
    </NavigationMenuLink>
  );
}

const productLinks: LinkItem[] = [
  {
    title: 'Convert Tools',
    href: '/convert',
    description: 'All conversion categories from one menu',
    icon: GlobeIcon,
  },
  {
    title: 'Compress Tools',
    href: '/compress',
    description: 'Video, image, GIF, and PDF compression',
    icon: LayersIcon,
  },
  {
    title: 'Utility Tools',
    href: '/utility-tools',
    description: 'Image, PDF, and workflow utilities',
    icon: UserPlusIcon,
  },
  {
    title: 'All Categories',
    href: '/tools',
    description: 'Browse all 120 published categories and tools',
    icon: BarChart,
  },
  {
    title: 'API',
    href: '/api',
    description: 'Use platform endpoints and integrations',
    icon: PlugIcon,
  },
  {
    title: 'Pricing',
    href: '/pricing',
    description: 'Plans for teams and creators',
    icon: CodeIcon,
  },
];

const companyLinks: LinkItem[] = [
  {
    title: 'Learning Hub',
    href: '/learning-hub',
    description: 'Guides and practical lessons',
    icon: Users,
  },
  {
    title: 'Library',
    href: '/library',
    description: 'Prompt packs and templates',
    icon: Star,
  },
  {
    title: 'Contact',
    href: '/contact',
    icon: Handshake,
    description: 'Reach the Velnora team',
  },
];

const companyLinks2: LinkItem[] = [
  {
    title: 'Terms of Service',
    href: '#',
    icon: FileText,
  },
  {
    title: 'Privacy Policy',
    href: '#',
    icon: Shield,
  },
  {
    title: 'Refund Policy',
    href: '#',
    icon: RotateCcw,
  },
  {
    title: 'Blog',
    href: '/blog',
    icon: Leaf,
  },
  {
    title: 'Help Center',
    href: '/contact',
    icon: HelpCircle,
  },
];

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}

const WordmarkIcon = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 120 24" fill="currentColor" {...props}>
    <path d="M2 3h6l4 13L16 3h5l4 13 4-13h6L31 21h-6l-3.5-11L18 21h-6L2 3Zm40 0h6v18h-6V3Zm12 0h7l9 11V3h6v18h-7L60 10v11h-6V3Zm28 0h6v7h10V3h6v18h-6v-6H88v6h-6V3Z" />
  </svg>
);
