import React from 'react';

const TYPE_COLORS: Record<string, string> = {
  viewBg: 'bg-black/90',
  keyword: 'text-[#676EC9]',
  number: 'text-green-400',
  string: 'text-blue-400',
  boolean: 'text-[#C2B280]',
  object: 'text-purple-400',
  array: 'text-orange-400',
};

function renderValue(value: any, keyName: string | null, isLast: boolean, depth: number): React.ReactNode {
  const indent = '  '.repeat(depth);

  // The attribute carrying the type takes the same color as its type
  let keyColor = TYPE_COLORS.keyword;
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.type === 'string' && TYPE_COLORS[value.type]) {
    keyColor = TYPE_COLORS[value.type];
  }

  const renderKey = () => {
    if (!keyName) return null;
    return <span className={keyColor}>"{keyName}"</span>;
  };

  const colon = keyName ? <span className="text-slate-300">: </span> : null;
  const comma = isLast ? '' : <span className="text-slate-300">,</span>;

  if (value === null) {
    return <div key={keyName || 'null'}>{indent}{renderKey()}{colon}<span className="text-slate-500">null</span>{comma}</div>;
  }

  if (typeof value === 'boolean') {
    return <div key={keyName || 'bool'}>{indent}{renderKey()}{colon}<span className={TYPE_COLORS.boolean}>{value ? 'true' : 'false'}</span>{comma}</div>;
  }

  if (typeof value === 'number') {
    return <div key={keyName || 'num'}>{indent}{renderKey()}{colon}<span className={TYPE_COLORS.number}>{value}</span>{comma}</div>;
  }

  if (typeof value === 'string') {
    let valClass = TYPE_COLORS.string;
    // Literal values ​​defining the type also take on their own color
    if (keyName === 'type' && TYPE_COLORS[value]) {
      valClass = TYPE_COLORS[value] + ' font-bold';
    }
    return <div key={keyName || 'str'}>{indent}{renderKey()}{colon}<span className={valClass}>"{value}"</span>{comma}</div>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div key={keyName || 'arr_empty'}>{indent}{renderKey()}{colon}<span className="text-slate-300">[]</span>{comma}</div>;
    }
    return (
      <div key={keyName || 'arr_block'}>
        <div>{indent}{renderKey()}{colon}<span className="text-slate-300">[</span></div>
        {value.map((item, index) => (
          <React.Fragment key={index}>
            {renderValue(item, null, index === value.length - 1, depth + 1)}
          </React.Fragment>
        ))}
        <div>{indent}<span className="text-slate-300">]</span>{comma}</div>
      </div>
    );
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return <div key={keyName || 'obj_empty'}>{indent}{renderKey()}{colon}<span className="text-slate-300">{"{}"}</span>{comma}</div>;
    }
    return (
      <div key={keyName || 'obj_block'}>
        <div>{indent}{renderKey()}{colon}<span className="text-slate-300">{"{"}</span></div>
        {keys.map((k, index) => (
          <React.Fragment key={k}>
            {renderValue(value[k], k, index === keys.length - 1, depth + 1)}
          </React.Fragment>
        ))}
        <div>{indent}<span className="text-slate-300">{"}"}</span>{comma}</div>
      </div>
    );
  }

  return null;
}

interface JsonViewerProps {
  data: any;
  className?: string;
  onDoubleClick?: React.MouseEventHandler<HTMLPreElement>;
}

export function JsonViewer({ data, className, onDoubleClick, ...props}: JsonViewerProps) {
  return (
    <pre className={`${TYPE_COLORS.viewBg} p-3 rounded-lg overflow-x-auto text-[10px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed ${className || ''}`}
      onDoubleClick={onDoubleClick}
      {...props}>
      {renderValue(data, null, true, 0)}
    </pre>
  );
}
