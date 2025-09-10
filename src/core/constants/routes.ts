export const ROUTES = {
    ADMIN: {
        LOGIN: '/admin/login',
        SETUP: '/admin/setup',
        EVENTS: {
            LIST: '/admin',
            CREATE: '/admin/events/create',
            DETAILS: (id: string) => `/admin/events/${id}`,
            EDIT: (id: string) => `/admin/events/${id}/edit`,
        },
        TICKETS: {
            LIST: '/admin/tickets',
            DETAILS: (id: string) => `/admin/tickets/${id}`,
        },
        USERS: {
            LIST: '/admin/users',
            PROFILE: (id: string) => `/admin/users/${id}`,
        },
        FORMS: {
            LIST: '/admin/forms',
            CREATE: '/admin/forms/create',
            DETAILS: (id: string) => `/admin/forms/${id}`,
            EDIT: (id: string) => `/admin/forms/${id}/edit`,
        },
        ANSWERS: {
            LIST: '/admin/answers',
            DETAILS: (id: number) => `/admin/answers/${id}`,
            WITH_VALUES: (id: number) => `/admin/answers/with_values/${id}`
        },
        INTERVIEWERS: {
            LIST: '/admin/interviewers',
            CREATE: '/admin/interviewers/create',
            EDIT: (id: string) => `/admin/interviewers/${id}/edit`,
            DETAILS: (id: string) => `/admin/interviewers/${id}`
        },
        VOLUNTEERS: {
            LIST: '/admin/volunteers',
            CREATE: '/admin/volunteers/create',
            EDIT: (id: string) => `/admin/volunteers/${id}/edit`,
            DETAILS: (id: string) => `/admin/volunteers/${id}`
        },
        NEEDY: {
            LIST: '/admin/needy',
            CREATE: '/admin/needy/create',
            EDIT: (id: number) => `/admin/needy/${id}/edit`,
            DETAILS: (id: number) => `/admin/needy/${id}`
        },
        IMAGES: {
            LIST: '/admin/images',
            CREATE: '/admin/images/create',
        },
        APPLICATION: {
            LIST: '/admin/application',
            CREATE: '/admin/application/create',
            DETAILS: (id: string) => `/admin/application/${id}`,
            EDIT: (id: string) => `/admin/application/${id}/edit`,
        },
        CONTACTS: {
            LIST: '/admin/contacts',
            CREATE: '/admin/contacts/create',
            EDIT: (id: string) => `/admin/contacts/${id}/edit`
        },
        INTERVIEWER_PAGES: {
            LIST: '/admin/interviewer-pages',
            CREATE: '/admin/interviewer-pages/create',
            EDIT: (id: string) => `/admin/interviewer-pages/${id}/edit`,
            DETAILS: (id: string) => `/admin/interviewer-pages/${id}`
        },
        ANALYTICS: '/admin/analytics'
    },
    FORMS: {
        PREVIEW: (formId: string) => `/forms/${formId}`,
        INTERVIEWER: (formId: string) => `/forms/${formId}/interviewer`,
        ANSWER: (formId: string, interviewerId?: number) =>
            interviewerId
                ? `/forms/${formId}/answer?interviewerId=${interviewerId}`
                : `/forms/${formId}/answer`,
        RESULTS: (formId: string) => `/forms/${formId}/results`
    }
} as const
