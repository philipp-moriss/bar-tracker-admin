
export interface InterviewerPage {
    id: number;
    title: string;
    subtitle?: string;
    fields: Field[];
}

export interface Field {
    key: string;
    label: string;
    type: 'INPUT' | 'TEXTAREA' | 'SELECT';
    isRequired: boolean;
    options?: string[];
} 