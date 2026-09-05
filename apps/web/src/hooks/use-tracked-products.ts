import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export function useTrackedProducts() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["tracked-products"],
    queryFn: () => fetcher("/tracked-products"),
  });

  return {
    products: data || [],
    isLoading,
    isError: error,
    mutate: refetch,
  };
}
