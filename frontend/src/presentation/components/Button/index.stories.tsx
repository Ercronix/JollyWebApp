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
        colorscheme: "gold",
        children: "Button",
    },
};

export const Outline: Story = {
    args: {
        variant: "outline",
        colorscheme: "gold",
        children: "Button",
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        colorscheme: 'gold',
        children: 'Button',
    },
    parameters: {
        pseudo: {
            hover: true,
        },
    },
};

// Colorschemes, each on the background it's meant for
export const Felt: Story = {
    args: {
        variant: "outline",
        colorscheme: "felt",
        children: "On the felt",
    },
    decorators: [(Story) => <div className="p-6 bg-felt"><Story/></div>],
};

export const Ink: Story = {
    args: {
        variant: "solid",
        colorscheme: "ink",
        children: "On a card",
    },
    decorators: [(Story) => <div className="p-6 bg-card"><Story/></div>],
};

export const Danger: Story = {
    args: {
        variant: "solid",
        colorscheme: "danger",
        children: "Delete",
    },
};
