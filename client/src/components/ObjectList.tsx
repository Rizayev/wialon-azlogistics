import { useMemo, useState } from 'react';
import type { Group, Unit } from '../types';
import { useLang } from '../LangContext';

interface Props {
  units: Unit[];
  groups: Group[];
  selected: number[];
  onSelected: (ids: number[]) => void;
}

export function ObjectList({ units, groups, selected, onSelected }: Props) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [groupId, setGroupId] = useState<number | 0>(0);

  const visible = useMemo(() => {
    let list = units;
    if (groupId) {
      const g = groups.find((x) => x.id === groupId);
      const set = new Set(g?.units || []);
      list = list.filter((u) => set.has(u.id));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((u) => u.nm.toLowerCase().includes(q));
    }
    return list;
  }, [units, groups, groupId, query]);

  const sel = new Set(selected);
  const allVisibleSelected = visible.length > 0 && visible.every((u) => sel.has(u.id));

  function toggle(id: number) {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelected([...next]);
  }

  function toggleAll() {
    if (allVisibleSelected) {
      const vis = new Set(visible.map((u) => u.id));
      onSelected(selected.filter((id) => !vis.has(id)));
    } else {
      onSelected([...new Set([...selected, ...visible.map((u) => u.id)])]);
    }
  }

  return (
    <div className="objlist">
      <input
        className="search"
        placeholder={t('obj.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="group-select"
        value={groupId}
        onChange={(e) => setGroupId(Number(e.target.value))}
      >
        <option value={0}>{t('obj.selectGroup')}</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nm} ({g.units.length})
          </option>
        ))}
      </select>

      <div className="objlist-head">
        <label className="cb">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
        </label>
        <span className="azsort">A↓Z</span>
      </div>

      <ul className="units">
        {visible.map((u) => (
          <li key={u.id} className={sel.has(u.id) ? 'unit selected' : 'unit'}>
            <label className="cb">
              <input
                type="checkbox"
                checked={sel.has(u.id)}
                onChange={() => toggle(u.id)}
              />
            </label>
            <span className="unit-ico" aria-hidden>
              🚛
            </span>
            <span className="unit-name" title={u.nm}>
              {u.nm}
            </span>
            <span className="unit-menu">⋮</span>
          </li>
        ))}
        {!visible.length && <li className="empty">{t('obj.empty')}</li>}
      </ul>
    </div>
  );
}
