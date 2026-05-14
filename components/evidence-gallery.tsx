"use client";

import { useEffect, useState } from "react";

interface EvidenceGalleryItem {
  id: string;
  label: string;
  description: string;
  signedUrl: string;
}

export function EvidenceGallery({
  reportId,
  initialItems
}: {
  reportId: string;
  initialItems: EvidenceGalleryItem[];
}) {
  const [items, setItems] = useState<EvidenceGalleryItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      try {
        const response = await fetch(`/api/public-evidence?reportId=${encodeURIComponent(reportId)}`, {
          cache: "no-store"
        });
        const data = (await response.json()) as { items?: EvidenceGalleryItem[] };

        if (!ignore) {
          setItems(data.items || []);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setItems([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [reportId]);

  if (loading && items.length === 0) {
    return (
      <div className="card-muted px-4 py-5 text-sm leading-7 text-slate-500">
        正在加载证据图片...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card-muted px-4 py-5 text-sm leading-7 text-slate-500">
        当前没有可预览的证据图片。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="card-muted space-y-3 px-4 py-4">
          <div>
            <h3 className="text-sm font-medium text-ink">{item.label}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
            <img src={item.signedUrl} alt={item.label} className="h-auto w-full object-contain" />
          </div>
        </article>
      ))}
    </div>
  );
}
