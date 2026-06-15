import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ITEMS_PER_PAGE } from "../../app/constants";

export default function Pagination({ page, setPage, handlePage, totalItems }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const start = totalItems === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const end = page * ITEMS_PER_PAGE > totalItems ? totalItems : page * ITEMS_PER_PAGE;

  const pageBtn =
    'flex h-[34px] min-w-[34px] items-center justify-center rounded-[9px] border text-sm font-semibold transition-colors cursor-pointer';

  return (
    <div className="mt-9 flex items-center justify-between border-t border-line-subtle px-1 pt-5">
      <p className="text-[13px] text-dim">
        Showing <span className="font-medium text-muted">{start}</span> to{' '}
        <span className="font-medium text-muted">{end}</span> of{' '}
        <span className="font-medium text-muted">{totalItems}</span> results
      </p>
      <nav className="flex items-center gap-2" aria-label="Pagination">
        <button
          onClick={() => handlePage(page > 1 ? page - 1 : page)}
          className={`${pageBtn} border-line bg-surface text-dim hover:border-[#475569] hover:text-content`}
          aria-label="Previous"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => handlePage(index + 1)}
            aria-current={index + 1 === page ? 'page' : undefined}
            className={`${pageBtn} ${
              index + 1 === page
                ? 'border-primary bg-primary-soft text-primary-lighter'
                : 'border-line bg-surface text-dim hover:text-content'
            } px-3`}
          >
            {index + 1}
          </button>
        ))}

        <button
          onClick={() => handlePage(page < totalPages ? page + 1 : page)}
          className={`${pageBtn} border-line bg-surface text-dim hover:border-[#475569] hover:text-content`}
          aria-label="Next"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
