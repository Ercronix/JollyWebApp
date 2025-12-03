import type { Meta, StoryObj } from "@storybook/react-vite";
import { LandingLayout } from "./LandingLayout";

const meta: Meta<typeof LandingLayout> = {
    title: "Layouts/LandingLayout",
    component: LandingLayout,
    parameters: {
        layout: "fullscreen",
    },
    tags: [
        "autodocs"
    ]
};

export default meta;

type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
    args: {
        children: <div className="text-white text-3xl font-bold">Landing Page</div>,
    },
};

// Gradient Variants
export const PurpleToBlue: Story = {
    args: {
        colorscheme: "purpleToBlue",
        children: <div className="text-white text-3xl font-bold">Purple to Blue</div>,
    },
};

export const CyanToBlue: Story = {
    args: {
        colorscheme: "cyanToBlue",
        children: <div className="text-white text-3xl font-bold">Cyan to Blue</div>,
    },
};

export const GreenToBlue: Story = {
    args: {
        colorscheme: "greenToBlue",
        children: <div className="text-white text-3xl font-bold">Green to Blue</div>,
    },
};

export const PurpleToPink: Story = {
    args: {
        colorscheme: "purpleToPink",
        children: <div className="text-white text-3xl font-bold">Purple to Pink</div>,
    },
};

export const PinkToOrange: Story = {
    args: {
        colorscheme: "pinkToOrange",
        children: <div className="text-white text-3xl font-bold">Pink to Orange</div>,
    },
};

export const TealToLime: Story = {
    args: {
        colorscheme: "tealToLime",
        children: <div className="text-gray-900 text-3xl font-bold">Teal to Lime</div>,
    },
};

export const RedToYellow: Story = {
    args: {
        colorscheme: "redToYellow",
        children: <div className="text-gray-900 text-3xl font-bold">Red to Yellow</div>,
    },
};
