import type { Meta, StoryObj } from "@storybook/react-vite";
import { LobbyPage } from "./LobbyPage";

const meta: Meta<typeof LobbyPage> = {
    title: "Pages/LobbyPage",
    component: LobbyPage,
    parameters: {
        layout: "fullscreen",
    },
    tags:[
        "autodocs",
    ]
};

export default meta;
type Story = StoryObj<typeof LobbyPage>;

export const Default: Story = {
    render: () => <LobbyPage />,
};

export const Empty: Story = {
    render: () => <LobbyPage lobbies={[]} />,
};

export const FewLobbies: Story = {
    render: () => (
        <LobbyPage
            lobbies={[
                { id: 1, name: "Solo Players", playerCount: 1 },
                { id: 2, name: "Quick Squad", playerCount: 3 },
            ]}
        />
    ),
};

export const ManyLobbies: Story = {
    render: () => (
        <LobbyPage
            lobbies={Array.from({ length: 20 }, (_, i) => ({
                id: i + 1,
                name: `Lobby ${i + 1}`,
                playerCount: Math.floor(Math.random() * 20),
            }))}
        />
    ),
};
