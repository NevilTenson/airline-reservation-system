export interface ExampleType {
    id: number;
    name: string;
    isActive: boolean;
}

export type ExampleArrayType = ExampleType[];

export type GenericResponse<T> = {
    data: T;
    error?: string;
};