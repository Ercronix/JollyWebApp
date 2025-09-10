import type {Meta, StoryObj} from "@storybook/react-vite";
import {Button} from ".";

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args:{
        children: "click me",
    },
};