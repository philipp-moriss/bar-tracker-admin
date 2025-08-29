import { ContactInfoResponse } from "./contact";
import type { CustomForm } from './customForm';

export type QuestionType = 'OPTION' | 'MULTI_OPTION' | 'INPUT' | 'NUMBER' | 'CHECKBOX';
export type DisplayType = 'FULL_CARD' | 'CARD' | 'TEXT_INPUT' | 'TEXT_AREA' | 'SLIDER' | 'NUM_PAD' | 'NUMBER_KEYBOARD' | 'CHECKBOX';

export interface Option {
    id?: number
    option_text: string
    order: number
}

export interface Question {
    id?: number
    question_type: QuestionType
    question_display_type: DisplayType
    question_text: string
    question_sub_text?: string
    step: number
    maxValue: number
    minValue: number
    maxLabel: string
    minLabel: string
    question_order: number
    options: Option[]
    question_image_id?: string
    question_image_url?: string
    has_other_option?: boolean
}

export interface User {
    id: number
    name: string
    email: string
    updatedAt: string
}

export interface Form {
    id?: number
    contactsInfo: ContactInfoResponse | null
    title: string
    agentId: string | null
    stepCount: number
    userId?: number
    user?: User
    questions: Question[]
    start_markup: string
    end_markup: string
    language: string
    application?: {
        id: number;
        name?: string;
        tag?: string;
        description?: string;
    }
    applicationId?: number
    showCodePage?: boolean
    contactsInfoId?: number | null
    customFormIds?: number[]
    customForms?: CustomForm[]
    partnerLogos?: string[]
    partnerLogosImages?: {
        id: number;
        name: string;
        s3Url: string;
    }[]
    interviewerPageId?: number;
    interviewerPage?: { id: number; title: string; subtitle?: string; fields?: { id: number; label: string; type: string }[] };
    created_at?: string;
    updated_at?: string;
    withOutAiFeedback?: boolean;
}

export interface FormsResponse {
    data: Form[]
    total: number
    page: number
    limit: number
}
