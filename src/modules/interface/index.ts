
export interface BaseFirebaseEntityClass<T> {
    setEntity: (entity: T) => Promise<string>;

    getEntityById: (id: string) => Promise<T>;

    getAllEntities: () => Promise<T[]>;
}