"use client";

import { useEffect, useState } from "react";

interface Category { id: string; name: string }

export function CategoryNav({ categories, color }: { categories: Category[]; color: string }) {
  const [active, setActive] = useState(categories[0]?.id ?? "");

  useEffect(() => {
    if (categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { threshold: 0.15, rootMargin: "-80px 0px -55% 0px" },
    );
    categories.forEach(({ id }) => {
      const el = document.getElementById(`cat-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length <= 1) return null;

  return (
    <div className="sticky top-0 z-20 bg-white/97 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`#cat-${cat.id}`}
            className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap"
            style={
              active === cat.id
                ? { backgroundColor: color, color: "#fff", boxShadow: `0 2px 10px ${color}50` }
                : { backgroundColor: "#f1f5f9", color: "#64748b" }
            }
          >
            {cat.name}
          </a>
        ))}
      </div>
    </div>
  );
}
