import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Les données restent considérées fraîches pendant 5 min
      gcTime: 1000 * 60 * 10,    // Conservation en mémoire cache pendant 10 min
      refetchOnWindowFocus: false, // Ne pas relancer les requêtes au changement d'onglet
      retry: 1,                 // Nombre d'essais en cas d'erreur
    },
  },
});
