import type { Artifact } from '../../types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

export interface ArtifactListProps {
  artifacts: Artifact[];
  onPreview: (artifact: Artifact) => void;
  onDownload: (artifact: Artifact) => void;
}

export function ArtifactList({ artifacts, onPreview, onDownload }: ArtifactListProps) {
  return (
    <Card className="space-y-2">
      <h3 className="text-lg font-bold text-white">Artifacts</h3>
      <div className="space-y-2">
        {artifacts.map((art) => (
          <div
            key={art.name}
            className="flex items-center justify-between rounded-lg border border-[#1f1f2e] bg-[#111118] p-3 transition-colors hover:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                <Icon name="file" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{art.name}</p>
                <Badge variant="secondary">{art.type}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{art.size}</span>
              <button onClick={() => onPreview(art)} className="text-gray-400 hover:text-white" aria-label={`Preview ${art.name}`}>
                <Icon name="eye" className="h-4 w-4" />
              </button>
              <button onClick={() => onDownload(art)} className="text-gray-400 hover:text-white" aria-label={`Download ${art.name}`}>
                <Icon name="download" className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
