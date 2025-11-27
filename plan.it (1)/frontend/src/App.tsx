import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import { useState } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    const [activeTab, setActiveTab] = useState('calendar');

    const handleNavigate = (tab: string) => {
        setActiveTab(tab);
    };

    const handleCalendarClick = () => {
        setActiveTab('calendar');
    };

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <div className="flex min-h-screen flex-col">
                    <Header onNavigate={handleNavigate} onCalendarClick={handleCalendarClick} />
                    <main className="flex-1">
                        <Dashboard activeTab={activeTab} onTabChange={setActiveTab} />
                    </main>
                    <Footer />
                </div>
                <Toaster />
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
