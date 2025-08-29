interface BackButtonProps {
    onClick: () => void;
    direction?: 'left' | 'right';
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, direction = 'left' }) => {
    return (
        <button
            className="flex items-center gap-2 rounded-lg bg-transparent"
            onClick={onClick}
        >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: direction === 'left' ? 'rotate(180deg)' : 'none' }}>
                <path d="M7.4248 16.5994L12.8581 11.1661C13.4998 10.5244 13.4998 9.47441 12.8581 8.83275L7.4248 3.39941" stroke="white" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
    );
};
