import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children, containerSize = 'lg' }) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1">
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${sizes[containerSize]}`}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
