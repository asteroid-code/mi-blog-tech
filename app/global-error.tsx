'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* This is the default Next.js error page component but it can be customized */}
        <NextError statusCode={undefined as any} />
        <button onClick={() => window.location.reload()}>Try again</button>
      </body>
    </html>
  );
}
