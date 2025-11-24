'use client';

import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const pathname = usePathname(); // Get current route path

  return (
    <div className='mt-12 w-full flex p-4'>
      <div className='max-w-6xl w-full flex justify-between items-center mx-auto max-md:justify-center max-md:flex-col gap-5'>
        <p className='max-sm:justify-center'>
          2025 © CodeLab(PSTU) | All Rights Reserved.
        </p>

        <div className='flex gap-3 items-center max-sm:justify-center'>
          {/* ✅ Show Admin button only on '/' route */}
          {pathname === '/' && (
            <Link
              href="/admin/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Admin
            </Link>
          )}

          <p>
            Developed by <b>Hasib-17❤️</b>
          </p>
          <Link
            href="https://github.com/Hasib-17"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="w-5 h-5 text-gray-700 hover:text-gray-500 cursor-pointer" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
