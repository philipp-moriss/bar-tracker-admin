import {Form, Option, Question} from "@/core/types/form";
import {Interviewer} from "@/core/types/interviewer";

export type AnswerValueType = 'OPTION' | 'MULTI_OPTION' | 'TEXT' | 'BOOLEAN' | 'NUMBER' | 'CHECKBOX';

export interface Answer {
    id: number;
    value_type: AnswerValueType;
    value_text?: string;
    value_number?: number;
    value_boolean?: boolean;
    question: Question
    options: Option[]
    optionsIds?: number[];
}

export interface FormAnswer {
    id: number
    created_at: string;
    interviewer: Interviewer;
    form?: Form | null;
    form_id_snapshot?: number;
    form_title_snapshot?: string;
    answers: Answer[];
    answer_values: Answer[];
    ai_answer?: string;
    ai_response?: string;
}

export interface CreateAnswer {
    formId: number;
    interviewerId?: number;
    applicationId?: number;
    application_code?: string;
    answers: AnswerCreate[];
}

export interface AnswerCreate {
        questionId: number;
        value_type: string;
        value_text?: string;
        value_number?: number;
        value_boolean?: boolean;
        optionsIds?: number[];
}
