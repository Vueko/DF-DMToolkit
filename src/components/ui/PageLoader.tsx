import { Spinner } from './Spinner'

export function PageLoader() {
    return (
        <div className="flex items-center justify-center w-full min-h-[50vh]">
            <Spinner size="lg" />
        </div>
    )
}
