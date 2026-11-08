import { IconButton } from './IconButton';
import { Select } from './form/Select';
import { formatNumber } from '@/paper/lib/format';
import s from './table.module.scss';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  noun?: string;
}

/** Pages with ellipsis: 1 … 4 5 6 … 10. */
export function pageList(page: number, pages: number): Array<number | 'gap'> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: Array<number | 'gap'> = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(pages - 1, page + 1);
  if (lo > 2) out.push('gap');
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < pages - 1) out.push('gap');
  out.push(pages);
  return out;
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className={s.pagination} aria-label="Pagination">
      <span className={s.range}>
        {formatNumber(from)} to {formatNumber(to)} of {formatNumber(total)}
      </span>
      <div className={s.pages}>
        <IconButton icon="chevron-left" label="Previous page" size={30} disabled={page <= 1} onClick={() => onPage(page - 1)} />
        {pageList(page, pages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className={s.gap} aria-hidden="true">
              …
            </span>
          ) : (
            <button key={p} type="button" className={s.page} aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => onPage(p)}>
              {p}
            </button>
          ),
        )}
        <IconButton icon="chevron-right" label="Next page" size={30} disabled={page >= pages} onClick={() => onPage(page + 1)} />
        <Select
          label="Rows per page"
          labelHidden
          size="sm"
          value={String(pageSize)}
          onChange={(v) => onPageSize(Number(v))}
          options={[25, 50, 100].map((n) => ({ value: String(n), label: `${n} per page` }))}
          fieldClassName={s.pageSize}
        />
      </div>
    </nav>
  );
}
