import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lobbyApi } from "@/core/api/lobbyApi";
import { userService } from "@/core/services/userService";

export function useLobby() {
    const user = userService.getUser();
    const qc = useQueryClient();

    const lobbiesQuery = useQuery({
        queryKey: ["lobbies"],
        queryFn: lobbyApi.getLobbies
    });

    const createLobbyMutation = useMutation({
        mutationFn: (name: string) =>
            lobbyApi.createLobby(name, user!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["lobbies"] });
        }
    });

    return {
        lobbies: lobbiesQuery.data || [],
        isLoading: lobbiesQuery.isLoading,
        createLobby: createLobbyMutation.mutate,
    };
}
