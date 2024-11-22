
export interface ChangeData {
	number?: string;
	internationalNumber?: string;
	nationalNumber?: string;
	e164Number?: string;
	countryCode?: string;
	dialCode?: string;
}

export interface Country {
    name: string;
    iso2: string;
    dialCode: string;
    priority: number;
    areaCodes?: string[];
    htmlId: string;
    flagClass: string;
    placeHolder: string;
}

export enum SearchCountryField {
	DialCode = 'dialCode',
	Iso2 = 'iso2',
	Name = 'name',
	All = 'all'
}

export enum PhoneNumberFormat {
	International = 'INTERNATIONAL',
	National = 'NATIONAL',
}

