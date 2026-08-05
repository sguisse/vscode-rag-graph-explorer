import React, { useMemo } from 'react';

const TYPE_COLORS: Record<string, string> = {
  viewBg: 'bg-black/90',
  keyword: 'text-[#676EC9]',
  modifier: 'text-yellow-400',
  comment: 'text-lime-500',
  str: 'text-blue-400',
  stereotype: 'text-[#979bda]',
};

interface PlantUmlViewProps extends React.HTMLAttributes<HTMLPreElement> {
  data: string;
  className?: string;
  onDoubleClick?: React.MouseEventHandler<HTMLPreElement>;
}

export function PlantUmlViewer({ data, className, onDoubleClick, ...props }: PlantUmlViewProps) {
  const html = useMemo(() => {
    if (!data) return "";

    // 1. HTML string escaping to prevent XSS and malformed tags
    let text = data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 2. Single-pass robust tokenizer
    // This guarantees that we don't accidentally match and replace the word "class"
    // inside a newly injected <span class="..."> tag from a previous regex pass.
    const tokenRegex = /('.*)|(".*?")|(&lt;&lt;.*?&gt;&gt;)|(\{field\}|\{method\})|(@startuml|@enduml|\b(?:package|class|interface|component|enum)\b)/g;

    text = text.replace(tokenRegex, (match, comment, str, stereotype, modifier, keyword) => {
      // Order matters: Return the first capturing group that matched
      if (comment) return `<span class="${TYPE_COLORS.comment} italic">${comment}</span>`;
      if (str) return `<span class="${TYPE_COLORS.str}">${str}</span>`;
      if (stereotype) return `<span class="${TYPE_COLORS.stereotype}">${stereotype}</span>`;
      if (modifier) return `<span class="${TYPE_COLORS.modifier}">${modifier}</span>`;
      if (keyword) return `<span class="font-bold ${TYPE_COLORS.keyword}">${keyword}</span>`;
      return match;
    });

    return text;
  }, [data]);

  return (
    <pre
      className={`${TYPE_COLORS.viewBg} p-3 rounded-lg overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap font-mono ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onDoubleClick={onDoubleClick}
      {...props}
    />
  );
}
