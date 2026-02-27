import Link from 'next/link';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-medium text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-sm font-normal text-gray-500">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
