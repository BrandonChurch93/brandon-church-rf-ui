import type { ReactNode, ThHTMLAttributes } from 'react';
import { Icon } from './Icon';
import s from './table.module.scss';

export type SortDir = 'asc' | 'desc';
export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

interface SortHeaderProps<K extends string> extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  sortKey: K;
  sort: SortState<K> | null;
  onSort: (key: K) => void;
  children: ReactNode;
  align?: 'start' | 'end';
}

/** A sortable column header. Click cycles ascending, descending, then back to the default. */
export function SortHeader<K extends string>({ sortKey, sort, onSort, children, align = 'start', className, ...rest }: SortHeaderProps<K>) {
  const active = sort?.key === sortKey;
  const dir = active ? sort!.dir : null;
  return (
    <th scope="col" aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'} className={`${className ?? ''}`} {...rest}>
      <button type="button" className={`${s.sort} ${align === 'end' ? s.end : ''}`} data-active={active || undefined} onClick={() => onSort(sortKey)}>
        {children}
        <Icon name={dir === 'asc' ? 'arrow-up' : dir === 'desc' ? 'arrow-down' : 'arrow-up-down'} size={13} className={s.sortIcon} />
      </button>
    </th>
  );
}

/** Next sort state in the asc, desc, default cycle. */
export function cycleSort<K extends string>(current: SortState<K> | null, key: K, firstDir: SortDir = 'asc'): SortState<K> | null {
  if (!current || current.key !== key) return { key, dir: firstDir };
  if (current.dir === firstDir) return { key, dir: firstDir === 'asc' ? 'desc' : 'asc' };
  return null;
}

export const tableStyles = s;
