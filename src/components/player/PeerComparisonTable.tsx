import { useMemo, useState } from 'react';
import type { PeerPlayer } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

export interface PeerComparisonTableProps {
  peers: PeerPlayer[];
  currentPlayerName: string;
}

type SortKey = 'name' | 'age' | 'production' | 'trajectory' | 'percentile';

export function PeerComparisonTable({ peers, currentPlayerName }: PeerComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('percentile');
  const [ascending, setAscending] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...peers];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const result = av > bv ? 1 : av < bv ? -1 : 0;
      return ascending ? result : -result;
    });
    return copy;
  }, [peers, sortKey, ascending]);

  const headers: Array<{ key: SortKey; label: string }> = [
    { key: 'name', label: 'Player' },
    { key: 'age', label: 'Age' },
    { key: 'production', label: 'Production' },
    { key: 'trajectory', label: 'Trajectory' },
    { key: 'percentile', label: 'Percentile' },
  ];

  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold text-white">Peer Comparison</h3>
      <table className="w-full text-left text-sm text-slate-300">
        <thead>
          <tr className="border-b border-[#1f1f2e] text-xs uppercase tracking-wider text-slate-500">
            {headers.map((h) => (
              <th key={h.key} className="cursor-pointer py-2" onClick={() => (h.key === sortKey ? setAscending(!ascending) : setSortKey(h.key))}>
                <span className="inline-flex items-center gap-1">
                  {h.label}
                  {sortKey === h.key ? <Icon name={ascending ? 'up' : 'down'} className="h-3 w-3" /> : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((peer) => {
            const isCurrent = peer.name === currentPlayerName || peer.isCurrentPlayer;
            return (
              <tr key={peer.name} className={`border-b border-[#1f1f2e]/60 ${isCurrent ? 'bg-cyan-500/10' : ''}`}>
                <td className="py-2 font-medium text-white">{peer.name}</td>
                <td>{peer.age}</td>
                <td>{peer.production.toFixed(2)}</td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      peer.trajectory === 'rising' ? 'text-green-300' : peer.trajectory === 'decline' ? 'text-red-300' : 'text-slate-300'
                    }`}
                  >
                    <Icon
                      name={peer.trajectory === 'rising' ? 'up' : peer.trajectory === 'decline' ? 'down' : 'stable'}
                      className="h-3 w-3"
                    />
                    {peer.trajectory}
                  </span>
                </td>
                <td className="font-mono">{peer.percentile}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
