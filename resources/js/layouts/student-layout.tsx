import { useState } from 'react';
import { Sidebar, type StudentTab } from '@/components/student/Sidebar';
import { Topbar } from '@/components/student/Topbar';
import { FlashMessages } from '@/components/flash-messages';

type StudentLayoutProps = {
    activeTab: StudentTab;
    onSelectTab: (tab: StudentTab) => void;
    children: React.ReactNode;
};

export default function StudentLayout({
    activeTab,
    onSelectTab,
    children,
}: StudentLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-upel-cloud dark:bg-background print:bg-white">
            <FlashMessages />
            <Sidebar
                activeTab={activeTab}
                onSelectTab={onSelectTab}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="lg:pl-[268px] print:pl-0">
                <Topbar
                    activeTab={activeTab}
                    onOpenMobile={() => setMobileOpen(true)}
                    onSelectTab={onSelectTab}
                />

                <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
