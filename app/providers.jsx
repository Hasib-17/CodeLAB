'use client';

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children, session }) {
    // you can pass session if you fetch server-side, else omit session prop.
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
