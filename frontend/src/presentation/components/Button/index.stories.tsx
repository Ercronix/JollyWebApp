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
        colorscheme: "accent",
        children: "Button",
    },
};

export const Outline: Story = {
    args: {
        variant: "outline",
        colorscheme: "accent",
        children: "Button",
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        colorscheme: 'accent',
        children: 'Button',
    },
    parameters: {
        pseudo: {
            hover: true,
        },
    },
};

// Colorschemes
export const Subtle: Story = {
    args: {
        variant: "outline",
        colorscheme: "subtle",
        children: "Cancel",
    },
    decorators: [(Story) => <div className="p-6 bg-ground"><Story/></div>],
};

export const Danger: Story = {
    args: {
        variant: "solid",
        colorscheme: "danger",
        children: "Delete",
    },
};
