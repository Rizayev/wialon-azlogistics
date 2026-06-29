import type { Group, ShowFilter, TemplateInfo, Unit, ViewMode } from '../types';
import { useLang } from '../LangContext';
import { ObjectList } from './ObjectList';
import { ReportSettings } from './ReportSettings';

interface Props {
  units: Unit[];
  groups: Group[];
  templates: TemplateInfo[];
  templateId: number;
  onTemplateId: (id: number) => void;
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
  const { t } = useLang();
  return (
    <aside className="sidebar">
      <div className="side-tabs">
        <button className="side-tab active">{t('side.objects')}</button>
        <button className="side-tab" disabled>
          {t('side.geozones')}
        </button>
        <button className="side-tab" disabled>
          {t('side.drivers')}
        </button>
      </div>
      <ObjectList
        units={props.units}
        groups={props.groups}
        selected={props.selected}
        onSelected={props.onSelected}
      />
      <ReportSettings
        templates={props.templates}
        templateId={props.templateId}
        onTemplateId={props.onTemplateId}
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
