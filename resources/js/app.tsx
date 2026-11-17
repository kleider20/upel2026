import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AdminLayout from '@/layouts/admin-layout';
import AdmissionsLayout from '@/layouts/admissions-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import ProfessorLayout from '@/layouts/professor-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('landing/'):
            case name === 'admin/login':
            case name === 'auth/login':
            case name === 'auth/reset-password':
            case name === 'auth/define-password':
            case name.startsWith('student/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('admissions/'):
                return AdmissionsLayout;
            case name.startsWith('admin/'):
                return AdminLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case name === 'dashboard/professor':
            case name.startsWith('dashboard/professor/'):
            case name.startsWith('professor/'):
                return ProfessorLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp: (app) => (
        <TooltipProvider delayDuration={0}>
            {app}
            <Toaster />
        </TooltipProvider>
    ),
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
