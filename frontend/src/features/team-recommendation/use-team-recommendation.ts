import {
  getGetDashboardSummaryQueryKey,
  getListRecommendationsQueryKey,
  useRecommendTeam,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useTeamRecommendationMutation() {
  const queryClient = useQueryClient();
  const recommendMutation = useRecommendTeam();

  const invalidateRecommendationViews = () => {
    void queryClient.invalidateQueries({
      queryKey: getListRecommendationsQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: getGetDashboardSummaryQueryKey(),
    });
  };

  return {
    recommendMutation,
    invalidateRecommendationViews,
  };
}
