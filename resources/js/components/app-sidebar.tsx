import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    ClipboardList,
    GraduationCap,
    LayoutGrid,
    LifeBuoy,
    Users,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { RoleBadge } from '@/components/portal/role-badge';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UpelLogo } from '@/components/landing/brand';
import { dashboard, landing } from '@/routes';
import type { Auth, NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Portal web',
        href: landing.url(),
        icon: BookOpen,
    },
    {
        title: 'Soporte',
        href: 'mailto:soporte@upel.edu.ve',
        icon: LifeBuoy,
    },
];

function navigationFor(role: string | null | undefined): {
    label: string;
    items: NavItem[];
} {
    const base = dashboard.url();

    switch (role) {
        case 'profesor':
            return {
                label: 'Mi cátedra',
                items: [
                    {
                        title: 'Resumen',
                        href: base,
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Cargar notas',
                        href: `${base}#cargar-notas`,
                        icon: ClipboardList,
                    },
                    {
                        title: 'Estudiantes',
                        href: `${base}#estudiantes`,
                        icon: Users,
                    },
                ],
            };
        case 'graduado':
            return {
                label: 'Mi comunidad',
                items: [
                    {
                        title: 'Resumen',
                        href: base,
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Récord académico',
                        href: `${base}#record`,
                        icon: GraduationCap,
                    },
                    {
                        title: 'Postgrados y cursos',
                        href: `${base}#programas`,
                        icon: Award,
                    },
                ],
            };
        default:
            return {
                label: 'Mi campus',
                items: [
                    {
                        title: 'Resumen',
                        href: base,
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Mis notas',
                        href: `${base}#notas`,
                        icon: ClipboardList,
                    },
                    {
                        title: 'Mi récord',
                        href: `${base}#record`,
                        icon: GraduationCap,
                    },
                ],
            };
    }
}

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const navigation = navigationFor(auth.user?.portal_role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <span className="flex h-10 items-center rounded-xl bg-white px-3 shadow-sm ring-1 ring-black/5">
                                    <UpelLogo className="h-7" />
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="hidden px-2 pt-2 group-data-[collapsible=icon]:hidden md:block">
                    <RoleBadge
                        role={auth.user?.portal_role}
                        label={auth.user?.portal_role_label}
                    />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navigation.items} label={navigation.label} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
