import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-8 mt-12 border-t border-gray-200/50 text-center text-xs text-gray-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; 2025 Mobility Cybersecurity Lab. All rights reserved.</p>
        <div className="flex gap-6">
            <Link href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" className="hover:text-gray-600 transition-colors">Lab Info</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
