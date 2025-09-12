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
        colorscheme: "primary",
        children: "Button",
    },
};

export const Outline: Story = {
    args: {
        variant: "outline",
        colorscheme: "primary",
        children: "Button",
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        colorscheme: 'primary',
        children: 'Button',
    },
    parameters: {
        pseudo: {
            hover: true,
        },
    },
};

// 🌈 Gradient Variants
export const PurpleToBlue: Story = {
    args: {
        variant: "solid",
        colorscheme: "purpleToBlue",
        children: "Purple to Blue",
    },
};

export const CyanToBlue: Story = {
    args: {
        variant: "solid",
        colorscheme: "cyanToBlue",
        children: "Cyan to Blue",
    },
};

export const GreenToBlue: Story = {
    args: {
        variant: "solid",
        colorscheme: "greenToBlue",
        children: "Green to Blue",
    },
};

export const PurpleToPink: Story = {
    args: {
        variant: "solid",
        colorscheme: "purpleToPink",
        children: "Purple to Pink",
    },
};

export const PinkToOrange: Story = {
    args: {
        variant: "solid",
        colorscheme: "pinkToOrange",
        children: "Pink to Orange",
    },
};

export const TealToLime: Story = {
    args: {
        variant: "solid",
        colorscheme: "tealToLime",
        children: "Teal to Lime",
    },
};

export const RedToYellow: Story = {
    args: {
        variant: "solid",
        colorscheme: "redToYellow",
        children: "Red to Yellow",
    },
};