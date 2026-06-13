import {
  getGetDashboardSummaryQueryKey,
  getListEmployeesQueryKey,
  useCreateEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useEmployeeMutations() {
  const queryClient = useQueryClient();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const invalidateEmployeeViews = () => {
    void queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
    void queryClient.invalidateQueries({
      queryKey: getGetDashboardSummaryQueryKey(),
    });
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    invalidateEmployeeViews,
  };
}
