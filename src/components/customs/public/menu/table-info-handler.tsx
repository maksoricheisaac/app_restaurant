'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { getTableById } from '@/actions/public/order-actions';
import { toast } from 'sonner';

export function TableInfoHandler() {
  const searchParams = useSearchParams();
  const { setTableInfo } = useCart();
  const tableIdFromUrl = searchParams.get('tableId');

  useEffect(() => {
    if (tableIdFromUrl) {
      const fetchTableInfo = async () => {
        try {
          const result = await getTableById({ tableId: tableIdFromUrl });
          if (result.data?.table) {
            setTableInfo(result.data.table.id, result.data.table.number);
            toast.info(`Vous êtes à la table n°${result.data.table.number}.`);
          } else {
            toast.error("La table scannée n'a pas été trouvée.");
          }
        } catch {
          toast.error("Erreur lors de la récupération des informations de la table.");
        }
      };

      fetchTableInfo();
    }
  }, [tableIdFromUrl, setTableInfo]);

  return null; // Ce composant n'affiche rien
}
