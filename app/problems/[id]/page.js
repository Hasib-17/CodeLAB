import Workspace from '@/components/workspace/Workspace';

export default async function page({ params }) {
  const { id } = params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/getProblembyId/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return <div className="p-4">Problem not found</div>;
  }

  const problem = await res.json();

  return <Workspace problem={problem} />;
}
