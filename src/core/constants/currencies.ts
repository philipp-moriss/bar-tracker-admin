export interface Currency {
    code: string;
    symbol: string;
    name: string;
    countries: string[];
}

export const CURRENCIES: Currency[] = [
    {
        code: 'gbp',
        symbol: '£',
        name: 'British Pound',
        countries: ['United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland']
    },
    {
        code: 'usd',
        symbol: '$',
        name: 'US Dollar',
        countries: ['United States', 'USA', 'America']
    },
    {
        code: 'eur',
        symbol: '€',
        name: 'Euro',
        countries: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Ireland', 'Portugal', 'Finland', 'Luxembourg', 'Slovenia', 'Cyprus', 'Malta', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania']
    },
    {
        code: 'pln',
        symbol: 'zł',
        name: 'Polish Złoty',
        countries: ['Poland', 'Polska']
    },
    {
        code: 'czk',
        symbol: 'Kč',
        name: 'Czech Koruna',
        countries: ['Czech Republic', 'Czechia']
    },
    {
        code: 'huf',
        symbol: 'Ft',
        name: 'Hungarian Forint',
        countries: ['Hungary']
    },
    {
        code: 'sek',
        symbol: 'kr',
        name: 'Swedish Krona',
        countries: ['Sweden']
    },
    {
        code: 'nok',
        symbol: 'kr',
        name: 'Norwegian Krone',
        countries: ['Norway']
    },
    {
        code: 'dkk',
        symbol: 'kr',
        name: 'Danish Krone',
        countries: ['Denmark']
    },
    {
        code: 'chf',
        symbol: 'CHF',
        name: 'Swiss Franc',
        countries: ['Switzerland']
    }
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
    return CURRENCIES.find(currency => currency.code === code);
};

export const getCurrencyByCountry = (country: string): Currency | undefined => {
    const normalizedCountry = country.toLowerCase();
    return CURRENCIES.find(currency =>
        currency.countries.some(c => c.toLowerCase().includes(normalizedCountry))
    );
};

export const getDefaultCurrency = (): Currency => {
    return CURRENCIES.find(c => c.code === 'gbp') || CURRENCIES[0];
};
