export interface CustomFormField {
    label: string;
    type: string;
    options: string[];
}

export interface CustomForm {
    id: number;
    title: string;
    description: string;
    fields: CustomFormField[];
}

export interface CreateCustomFormRequest {
    title: string;
    description: string;
    fields: CustomFormField[];
}

export interface CustomFormResponse {
    id: string;
    createdAt: string;
    form?: {
        id: string;
        title: string;
    };
    interviewer?: {
        name: string;
        email: string;
    };
    values: Array<{
        fieldId: number;
        value: string;
    }>;
}

export interface CustomFormFieldValue {
    fieldId: number;
    value: string;
}

export interface CreateCustomFormResponseRequest {
    formId: number;
    mainFormId: number;
    interviewerId: number;
    values: CustomFormFieldValue[];
} 