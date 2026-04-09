import type { ReactElement } from 'react';
import type { PipelineStep } from '../../types';

interface IconProps {
  name:
    | 'upload'
    | 'process'
    | 'validate'
    | 'complete'
    | 'file'
    | 'eye'
    | 'download'
    | 'up'
    | 'down'
    | 'stable'
    | PipelineStep;
  className?: string;
}

export function Icon({ name, className = 'h-4 w-4' }: IconProps) {
  const key = name === 'processing' ? 'process' : name;
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };

  const icons: Record<string, ReactElement> = {
    upload: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />,
    process: <path d="M12 2v4m0 12v4M4.9 4.9l2.8 2.8m8.6 8.6 2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m8.6-8.6 2.8-2.8" />,
    validate: <path d="M20 6 9 17l-5-5" />,
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />,
    eye: <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />,
    up: <path d="m6 15 6-6 6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    stable: <path d="M4 12h16" />,
    idle: <circle cx="12" cy="12" r="9" />,
    uploading: <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />,
    validating: <path d="M20 6 9 17l-5-5" />,
    complete: <path d="M20 6 9 17l-5-5" />,
  };

  return <svg {...common}>{icons[key] ?? icons.idle}</svg>;
}
