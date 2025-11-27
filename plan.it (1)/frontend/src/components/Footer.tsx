import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t bg-muted/30 py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                © 2025. Built with{' '}
                <Heart className="inline h-4 w-4 fill-primary text-primary" /> using{' '}
                <a
                    href="https://caffeine.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                >
                    caffeine.ai
                </a>
            </div>
        </footer>
    );
}
