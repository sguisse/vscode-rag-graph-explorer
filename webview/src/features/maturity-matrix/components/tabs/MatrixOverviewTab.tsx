import { useMemo } from 'react';

type Category = {
  id: string;
  name: string;
  status: 'ready' | 'in_progress' | 'pending';
  score: number;
  description: string;
};

export function MatrixOverviewTab() {
  const categories = useMemo<Category[]>(
    () => [
      {
        id: 'strategy',
        name: 'Strategy',
        status: 'ready',
        score: 90,
        description: 'Strong alignment and roadmap clarity.',
      },
      {
        id: 'delivery',
        name: 'Delivery',
        status: 'in_progress',
        score: 72,
        description: 'Workflow is stable but still needs tightening.',
      },
      {
        id: 'governance',
        name: 'Governance',
        status: 'pending',
        score: 64,
        description: 'Controls should be reviewed and formalized.',
      },
    ],
    []
  );

  const handleSelectCategory = (id: string) => {
    console.info('[MatrixOverviewTab] selected category:', id);
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => handleSelectCategory(category.id)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-left transition hover:border-indigo-500 hover:bg-slate-800"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-white">{category.name}</span>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-300">
              {category.status}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{category.description}</span>
            <span className="text-sm font-semibold text-indigo-300">{category.score}/100</span>
          </div>
        </button>
      ))}
    </div>
  );
}
