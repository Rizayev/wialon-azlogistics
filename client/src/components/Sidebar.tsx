import type { Group, ShowFilter, Unit, ViewMode } from '../types';
import { ObjectList } from './ObjectList';
import { ReportSettings } from './ReportSettings';

interface Props {
  units: Unit[];
  groups: Group[];
  selected: number[];
  onSelected: (ids: number[]) => void;
  show: ShowFilter;
  onShow: (s: ShowFilter) => void;
  minParking: number;
  onMinParking: (n: number) => void;
  minMovement: number;
  onMinMovement: (n: number) => void;
  viewMode: ViewMode;
  onViewMode: (v: ViewMode) => void;
}

export function Sidebar(props: Props) {
  return (
    <aside className="sidebar">
      <div className="side-tabs">
        <button className="side-tab active">Объекты</button>
        <button className="side-tab" disabled>
          Геозоны
        </button>
        <button className="side-tab" disabled>
          Водители
        </button>
      </div>
      <ObjectList
        units={props.units}
        groups={props.groups}
        selected={props.selected}
        onSelected={props.onSelected}
      />
      <ReportSettings
        show={props.show}
        onShow={props.onShow}
        minParking={props.minParking}
        onMinParking={props.onMinParking}
        minMovement={props.minMovement}
        onMinMovement={props.onMinMovement}
        viewMode={props.viewMode}
        onViewMode={props.onViewMode}
      />
    </aside>
  );
}
