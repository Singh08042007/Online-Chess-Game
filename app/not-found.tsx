import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mb-2">Square Not on Board</h2>
      <p className="text-slate-400 text-xs sm:text-sm max-w-md mb-6">
        The page or chess game room you are looking for does not exist or has been archived.
      </p>
      <Link href="/">
        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
          Return to Arena Home
        </Button>
      </Link>
    </div>
  );
}
