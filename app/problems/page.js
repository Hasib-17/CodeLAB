import Problems from '@/components/Problems';

export default async function page() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/getAllProblems`, {
    cache: 'no-store',
  });
  const problems = await res.json();

  return <Problems problems={problems} />;
}
