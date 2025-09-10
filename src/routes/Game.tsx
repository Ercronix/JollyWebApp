import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/Game')({
    component: GamePage,
})

function GamePage(){
    return (
        <div>
        </div>
    )
}