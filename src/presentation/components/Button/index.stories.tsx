import type {Meta, StoryObj} from "@storybook/react-vite";
import {Button} from ".";

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: [
        "autodocs"
    ]
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Solid: Story = {
    args: {
        variant: "solid",
        children: "Button",
    },
};

export const Outline: Story = {
    args: {
        variant: "outline",
        children: "Button",
    },
};

export const Ghost: Story = {
    args: {
        variant: "ghost",
        children: "Button",
    },
};
// 🌈 Gradient Variants
export const PurpleToBlue: Story = {
    args: {
        colorscheme: "purpleToBlue",
        children: "Purple to Blue",
    },
};

export const CyanToBlue: Story = {
    args: {
        colorscheme: "cyanToBlue",
        children: "Cyan to Blue",
    },
};

export const GreenToBlue: Story = {
    args: {
        colorscheme: "greenToBlue",
        children: "Green to Blue",
    },
};

export const PurpleToPink: Story = {
    args: {
        colorscheme: "purpleToPink",
        children: "Purple to Pink",
    },
};

export const PinkToOrange: Story = {
    args: {
        colorscheme: "pinkToOrange",
        children: "Pink to Orange",
    },
};

export const TealToLime: Story = {
    args: {
        colorscheme: "tealToLime",
        children: "Teal to Lime",
    },
};

export const RedToYellow: Story = {
    args: {
        colorscheme: "redToYellow",
        children: "Red to Yellow",
    },
};