interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
    return (
        <div className="flex gap-2 w-full mb-5" dir="ltr">
            {[...Array(totalSteps)].map((_, index) => (
                <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all ${
                        index <= currentStep ? 'bg-[#B2C1FF]' : 'bg-gray-200'
                    }`}
                />
            ))}
        </div>
    )
}
